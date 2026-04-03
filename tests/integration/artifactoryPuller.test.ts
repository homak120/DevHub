import { strict as assert } from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { ArtifactoryPuller } from '../../src/services/artifactoryPuller';
import { Tool } from '../../src/types/tool';

describe('ArtifactoryPuller', () => {
    let puller: ArtifactoryPuller;
    const mockProgress = { report: sinon.stub() };
    const mockToken: vscode.CancellationToken = {
        isCancellationRequested: false,
        onCancellationRequested: () => ({ dispose: () => {} }),
    };

    const artifactoryTool: Tool = {
        id: 'smartada',
        name: 'SmartADA',
        description: 'Accessibility tool',
        category: 'Quality',
        type: 'artifactory',
        version: '2.0.0',
        registrySource: {
            repository: 'aep-tools-release',
            artifactPath: 'smartada/2.0.0/smartada-bundle.zip',
            targetPath: '.smartada',
        },
    };

    const extensionTool: Tool = {
        id: 'test-ext',
        name: 'Test Extension',
        description: 'Extension',
        category: 'Extensions',
        type: 'extension',
        version: '1.0.0',
        registrySource: { extensionId: 'test.ext', vsixPath: 'path.vsix' },
    };

    beforeEach(() => {
        puller = new ArtifactoryPuller();
        mockProgress.report.resetHistory();
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should handle artifactory type tools', () => {
        assert.equal(puller.canHandle(artifactoryTool), true);
    });

    it('should not handle non-artifactory type tools', () => {
        assert.equal(puller.canHandle(extensionTool), false);
    });

    it('should fail when no workspace is open', async () => {
        vscode.workspace.workspaceFolders = undefined;
        const result = await puller.install(artifactoryTool, mockProgress, mockToken);
        assert.equal(result.success, false);
        assert.ok(result.message.includes('No workspace'));
    });

    it('should have correct install interface', () => {
        assert.equal(typeof puller.install, 'function');
        assert.equal(typeof puller.canHandle, 'function');
    });
});
