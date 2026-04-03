import { strict as assert } from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { StatusDetector } from '../../src/services/statusDetector';
import { Tool } from '../../src/types/tool';

describe('StatusDetector', () => {
    let detector: StatusDetector;

    beforeEach(() => {
        detector = new StatusDetector();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('extension status', () => {
        const extensionTool: Tool = {
            id: 'test-ext',
            name: 'Test Extension',
            description: 'Test',
            category: 'Extensions',
            type: 'extension',
            version: '1.0.0',
            registrySource: { extensionId: 'test.extension', vsixPath: 'path.vsix' },
        };

        it('should detect installed extension via vscode.extensions.all', async () => {
            (vscode.extensions as { all: { id: string; packageJSON: { version: string } }[] }).all = [
                { id: 'test.extension', packageJSON: { version: '1.0.0' } },
            ];
            const status = await detector.detectStatus(extensionTool);
            assert.equal(status, 'installed');
        });

        it('should detect not-installed extension', async () => {
            (vscode.extensions as { all: { id: string; packageJSON: { version: string } }[] }).all = [];
            const status = await detector.detectStatus(extensionTool);
            assert.equal(status, 'not-installed');
        });

        it('should detect update-available when versions differ', async () => {
            (vscode.extensions as { all: { id: string; packageJSON: { version: string } }[] }).all = [
                { id: 'test.extension', packageJSON: { version: '0.9.0' } },
            ];
            const status = await detector.detectStatus(extensionTool);
            assert.equal(status, 'update-available');
        });
    });

    describe('npm status', () => {
        const npmTool: Tool = {
            id: 'test-npm',
            name: 'Test NPM',
            description: 'Test',
            category: 'CLI',
            type: 'npm',
            version: '2.0.0',
            registrySource: { packageName: '@test/cli', dependencyType: 'devDependencies' },
        };

        it('should detect not-installed when no workspace', async () => {
            vscode.workspace.workspaceFolders = undefined;
            const status = await detector.detectStatus(npmTool);
            assert.equal(status, 'not-installed');
        });
    });

    describe('artifactory status', () => {
        const artifactoryTool: Tool = {
            id: 'test-artifact',
            name: 'Test Artifact',
            description: 'Test',
            category: 'Quality',
            type: 'artifactory',
            version: '1.0.0',
            registrySource: { repository: 'repo', artifactPath: 'path', targetPath: '.target' },
        };

        it('should detect not-installed when no workspace', async () => {
            vscode.workspace.workspaceFolders = undefined;
            const status = await detector.detectStatus(artifactoryTool);
            assert.equal(status, 'not-installed');
        });
    });

    describe('deprecated tools', () => {
        it('should return deprecated status for deprecated tools', async () => {
            const tool: Tool = {
                id: 'old-tool',
                name: 'Old Tool',
                description: 'Deprecated',
                category: 'Legacy',
                type: 'extension',
                version: '1.0.0',
                registrySource: { extensionId: 'old.ext', vsixPath: 'path.vsix' },
                deprecated: true,
            };
            const status = await detector.detectStatus(tool);
            assert.equal(status, 'deprecated');
        });
    });

    describe('batch detection', () => {
        it('should detect statuses for all tools', async () => {
            (vscode.extensions as { all: { id: string; packageJSON: { version: string } }[] }).all = [];
            const tools: Tool[] = [
                {
                    id: 'tool-a',
                    name: 'A',
                    description: 'A',
                    category: 'Cat',
                    type: 'extension',
                    version: '1.0.0',
                    registrySource: { extensionId: 'a.ext', vsixPath: 'path.vsix' },
                },
                {
                    id: 'tool-b',
                    name: 'B',
                    description: 'B',
                    category: 'Cat',
                    type: 'extension',
                    version: '1.0.0',
                    registrySource: { extensionId: 'b.ext', vsixPath: 'path.vsix' },
                },
            ];
            const statuses = await detector.detectAllStatuses(tools);
            assert.equal(statuses.size, 2);
            assert.equal(statuses.get('tool-a'), 'not-installed');
            assert.equal(statuses.get('tool-b'), 'not-installed');
        });
    });
});
