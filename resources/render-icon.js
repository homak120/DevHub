// Renders devhub-marketplace.png with a TRUE transparent background.
// Draws the rounded blue tile + white hub-and-spoke, 4x4 supersampled, RGBA.
const fs = require('fs');
const zlib = require('zlib');

const SIZE = 128, SS = 4, R = 28, B = 64; // canvas, supersample, corner radius, half-size
const c0 = [18, 144, 230], c1 = [0, 90, 153]; // gradient stops (#1290E6 -> #005A99)

// hub geometry (128-space)
const CX = 64, CY = 64, ORBIT = 34, RC = 13, RN = 7.5, SPOKE = 2.5;
const angles = [0, 60, 120, 180, 240, 300];
const nodes = angles.map(a => {
  const t = a * Math.PI / 180;
  return [CX + ORBIT * Math.cos(t), CY - ORBIT * Math.sin(t)];
});

function insideRoundRect(x, y) {
  const qx = Math.abs(x - B) - (B - R);
  const qy = Math.abs(y - B) - (B - R);
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - R;
  return outside <= 0;
}
function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function isWhite(x, y) {
  if (Math.hypot(x - CX, y - CY) <= RC) return true;
  for (const [nx, ny] of nodes) if (Math.hypot(x - nx, y - ny) <= RN) return true;
  for (const [nx, ny] of nodes) if (distToSeg(x, y, CX, CY, nx, ny) <= SPOKE) return true;
  return false;
}
// color+alpha at a single sample point (hard-edged; AA comes from supersampling)
function sample(x, y) {
  if (!insideRoundRect(x, y)) return [0, 0, 0, 0];
  if (isWhite(x, y)) return [255, 255, 255, 255];
  const t = Math.max(0, Math.min(1, (x + y) / 256));
  return [
    Math.round(c0[0] + (c1[0] - c0[0]) * t),
    Math.round(c0[1] + (c1[1] - c0[1]) * t),
    Math.round(c0[2] + (c1[2] - c0[2]) * t),
    255,
  ];
}

// render + downsample with premultiplied-alpha averaging (no dark fringes)
const out = Buffer.alloc(SIZE * SIZE * 4);
for (let Y = 0; Y < SIZE; Y++) {
  for (let X = 0; X < SIZE; X++) {
    let pr = 0, pg = 0, pb = 0, pa = 0;
    for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++) {
      const [r, g, b, a] = sample(X + (i + 0.5) / SS, Y + (j + 0.5) / SS);
      const af = a / 255;
      pr += r * af; pg += g * af; pb += b * af; pa += af;
    }
    const n = SS * SS, avgA = pa / n;
    const o = (Y * SIZE + X) * 4;
    if (avgA <= 0) { out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0; }
    else {
      out[o] = Math.round(pr / pa);
      out[o + 1] = Math.round(pg / pa);
      out[o + 2] = Math.round(pb / pa);
      out[o + 3] = Math.round(avgA * 255);
    }
  }
}

// encode PNG (color type 6, 8-bit)
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const tb = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.concat([tb, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(crcBuf) >>> 0, 0);
  return Buffer.concat([len, tb, data, crc]);
}
const crcTable = (() => {
  const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t;
})();
function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return c ^ 0xffffffff; }

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const stride = SIZE * 4;
const raw = Buffer.alloc(SIZE * (stride + 1));
for (let y = 0; y < SIZE; y++) { raw[y * (stride + 1)] = 0; out.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride); }
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);
fs.writeFileSync(__dirname + '/devhub-marketplace.png', png);
console.log('wrote devhub-marketplace.png (' + SIZE + 'x' + SIZE + ', transparent RGBA)');
