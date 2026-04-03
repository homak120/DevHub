import { strict as assert } from 'assert';
import { describe, it } from 'mocha';
import * as vscode from 'vscode';
import { getWebviewContent } from '../../src/webview/getWebviewContent';

describe('getWebviewContent', () => {
    it('should contain a Content-Security-Policy meta tag with nonce', () => {
        const mockWebview = new vscode.MockWebview();
        const extensionUri = vscode.Uri.file('/mock/extension');
        const nonce = 'test-nonce-123';

        const html = getWebviewContent(mockWebview, extensionUri, nonce);

        assert.ok(html.includes('Content-Security-Policy'), 'Should include CSP');
        assert.ok(html.includes(`nonce-${nonce}`), 'Should include nonce value');
    });

    it('should contain a search input element', () => {
        const mockWebview = new vscode.MockWebview();
        const extensionUri = vscode.Uri.file('/mock/extension');
        const nonce = 'test-nonce-123';

        const html = getWebviewContent(mockWebview, extensionUri, nonce);

        assert.ok(html.includes('<input'), 'Should include input element');
        assert.ok(html.toLowerCase().includes('search'), 'Should reference search');
    });

    it('should contain section containers for Installed and Available', () => {
        const mockWebview = new vscode.MockWebview();
        const extensionUri = vscode.Uri.file('/mock/extension');
        const nonce = 'test-nonce-123';

        const html = getWebviewContent(mockWebview, extensionUri, nonce);

        assert.ok(html.includes('installed-section'), 'Should include installed section');
        assert.ok(html.includes('available-section'), 'Should include available section');
    });

    it('should use webview.asWebviewUri for script and style URIs', () => {
        const mockWebview = new vscode.MockWebview();
        const extensionUri = vscode.Uri.file('/mock/extension');
        const nonce = 'test-nonce-123';

        const html = getWebviewContent(mockWebview, extensionUri, nonce);

        assert.ok(html.includes('https://webview.mock/'), 'Should use asWebviewUri');
        assert.ok(html.includes('catalog.css'), 'Should reference catalog.css');
        assert.ok(html.includes('catalog.js'), 'Should reference catalog.js');
    });

    it('should be a valid HTML document', () => {
        const mockWebview = new vscode.MockWebview();
        const extensionUri = vscode.Uri.file('/mock/extension');
        const nonce = 'test-nonce-123';

        const html = getWebviewContent(mockWebview, extensionUri, nonce);

        assert.ok(html.includes('<!DOCTYPE html>'), 'Should have DOCTYPE');
        assert.ok(html.includes('<html'), 'Should have html tag');
        assert.ok(html.includes('</html>'), 'Should close html tag');
        assert.ok(html.includes('<head>'), 'Should have head');
        assert.ok(html.includes('<body>'), 'Should have body');
    });
});
