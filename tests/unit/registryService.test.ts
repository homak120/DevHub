import { strict as assert } from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { RegistryService } from '../../src/services/registryService';

const validRegistry = {
    version: '1.0.0',
    tools: [
        {
            id: 'test-tool',
            name: 'Test Tool',
            description: 'A test tool',
            category: 'Testing',
            type: 'extension',
            version: '1.0.0',
            registrySource: { extensionId: 'test.ext', vsixPath: 'path.vsix' },
        },
    ],
};

describe('RegistryService', () => {
    let service: RegistryService;
    const mockStorageUri = vscode.Uri.file('/tmp/test-storage');

    beforeEach(() => {
        service = new RegistryService(mockStorageUri);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should load registry from bundled JSON', async () => {
        const registry = await service.loadRegistry();
        assert.ok(registry);
        assert.equal(typeof registry.version, 'string');
        assert.ok(Array.isArray(registry.tools));
        assert.ok(registry.tools.length > 0);
    });

    it('should cache registry after successful load', async () => {
        const registry = await service.loadRegistry();
        const cached = service.getCachedRegistry();
        assert.deepEqual(cached, registry);
    });

    it('should return cached registry from getCachedRegistry', async () => {
        // Before load, should be undefined
        assert.equal(service.getCachedRegistry(), undefined);

        await service.loadRegistry();
        const cached = service.getCachedRegistry();
        assert.ok(cached);
        assert.ok(cached.tools.length > 0);
    });

    it('should validate parsed registry output', async () => {
        const registry = await service.loadRegistry();
        for (const tool of registry.tools) {
            assert.equal(typeof tool.id, 'string');
            assert.equal(typeof tool.name, 'string');
            assert.equal(typeof tool.description, 'string');
            assert.equal(typeof tool.category, 'string');
            assert.equal(typeof tool.type, 'string');
            assert.equal(typeof tool.version, 'string');
            assert.ok(tool.registrySource);
        }
    });
});
