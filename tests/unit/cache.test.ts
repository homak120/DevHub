import { strict as assert } from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { writeCache, readCache } from '../../src/utils/cache';
import { ToolRegistry } from '../../src/types/registry';

describe('Cache Helpers', () => {
    const mockUri = vscode.Uri.file('/tmp/test-storage');
    const testRegistry: ToolRegistry = {
        version: '1.0.0',
        tools: [
            {
                id: 'test-tool',
                name: 'Test Tool',
                description: 'A test',
                category: 'Testing',
                type: 'extension',
                version: '1.0.0',
                registrySource: { extensionId: 'test.ext', vsixPath: 'path.vsix' },
            },
        ],
    };

    afterEach(() => {
        sinon.restore();
    });

    it('should write registry to globalStorageUri', async () => {
        const writeFileSpy = sinon.spy(vscode.workspace.fs, 'writeFile');
        await writeCache(mockUri, testRegistry);
        assert.ok(writeFileSpy.calledOnce);
    });

    it('should read registry back from cache', async () => {
        sinon.stub(vscode.workspace.fs, 'readFile').resolves(
            Buffer.from(JSON.stringify(testRegistry))
        );
        const result = await readCache(mockUri);
        assert.ok(result);
        assert.equal(result!.version, '1.0.0');
        assert.equal(result!.tools.length, 1);
    });

    it('should return undefined for missing cache', async () => {
        sinon.stub(vscode.workspace.fs, 'readFile').rejects(new Error('File not found'));
        const result = await readCache(mockUri);
        assert.equal(result, undefined);
    });
});
