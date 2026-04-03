import { strict as assert } from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { NpmInstaller, SpawnFn } from '../../src/services/npmInstaller';
import { Tool } from '../../src/types/tool';

describe('NpmInstaller', () => {
    const mockProgress = { report: sinon.stub() };
    const mockToken: vscode.CancellationToken = {
        isCancellationRequested: false,
        onCancellationRequested: () => ({ dispose: () => {} }),
    };

    const npmTool: Tool = {
        id: 'farmfix-cli',
        name: 'FarmFix CLI',
        description: 'CLI tool',
        category: 'CLI Tools',
        type: 'npm',
        version: '3.1.0',
        registrySource: { packageName: '@aep/farmfix-cli', dependencyType: 'devDependencies' },
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

    function createMockProcess() {
        const proc = new EventEmitter();
        const p = proc as unknown as Record<string, unknown>;
        p.stdout = new EventEmitter();
        p.stderr = new EventEmitter();
        p.kill = sinon.stub().returns(true);
        return proc as unknown as ChildProcess & { stdout: EventEmitter; stderr: EventEmitter };
    }

    beforeEach(() => {
        mockProgress.report.resetHistory();
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should handle npm type tools', () => {
        const installer = new NpmInstaller();
        assert.equal(installer.canHandle(npmTool), true);
    });

    it('should not handle non-npm type tools', () => {
        const installer = new NpmInstaller();
        assert.equal(installer.canHandle(extensionTool), false);
    });

    it('should fail when no workspace is open', async () => {
        vscode.workspace.workspaceFolders = undefined;
        const installer = new NpmInstaller();
        const result = await installer.install(npmTool, mockProgress, mockToken);
        assert.equal(result.success, false);
        assert.ok(result.message.includes('No workspace'));
    });

    it('should spawn npm with correct args for devDependencies', async () => {
        vscode.workspace.workspaceFolders = [{ uri: vscode.Uri.file('/tmp/workspace') }];

        const mockProc = createMockProcess();
        const spawnStub = sinon.stub().returns(mockProc) as unknown as SpawnFn;
        const installer = new NpmInstaller(spawnStub);

        const installPromise = installer.install(npmTool, mockProgress, mockToken);

        setTimeout(() => {
            mockProc.stdout.emit('data', Buffer.from('added 1 package\n'));
            mockProc.emit('close', 0);
        }, 10);

        const result = await installPromise;

        assert.ok((spawnStub as unknown as sinon.SinonStub).calledOnce);
        const spawnArgs = (spawnStub as unknown as sinon.SinonStub).firstCall.args;
        assert.equal(spawnArgs[0], 'npm');
        assert.ok(spawnArgs[1].includes('install'));
        assert.ok(spawnArgs[1].includes('@aep/farmfix-cli@3.1.0'));
        assert.ok(spawnArgs[1].includes('--save-dev'));
        assert.equal(result.success, true);
    });

    it('should use --save for dependencies type', async () => {
        const depTool: Tool = {
            ...npmTool,
            registrySource: { packageName: '@aep/farmfix-cli', dependencyType: 'dependencies' },
        };

        vscode.workspace.workspaceFolders = [{ uri: vscode.Uri.file('/tmp/workspace') }];

        const mockProc = createMockProcess();
        const spawnStub = sinon.stub().returns(mockProc) as unknown as SpawnFn;
        const installer = new NpmInstaller(spawnStub);

        const installPromise = installer.install(depTool, mockProgress, mockToken);

        setTimeout(() => {
            mockProc.emit('close', 0);
        }, 10);

        await installPromise;

        const spawnArgs = (spawnStub as unknown as sinon.SinonStub).firstCall.args;
        assert.ok(spawnArgs[1].includes('--save'));
        assert.ok(!spawnArgs[1].includes('--save-dev'));
    });

    it('should return failure on non-zero exit code', async () => {
        vscode.workspace.workspaceFolders = [{ uri: vscode.Uri.file('/tmp/workspace') }];

        const mockProc = createMockProcess();
        const spawnStub = sinon.stub().returns(mockProc) as unknown as SpawnFn;
        const installer = new NpmInstaller(spawnStub);

        const installPromise = installer.install(npmTool, mockProgress, mockToken);

        setTimeout(() => {
            mockProc.stderr.emit('data', Buffer.from('ERR! 404\n'));
            mockProc.emit('close', 1);
        }, 10);

        const result = await installPromise;
        assert.equal(result.success, false);
    });
});
