import { strict as assert } from 'assert';
import { describe, it, beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { CatalogViewProvider } from '../../src/webview/catalogViewProvider';
import { RegistryService } from '../../src/services/registryService';
import { StatusDetector } from '../../src/services/statusDetector';
import { ToolStatus } from '../../src/types/operations';
import { Tool } from '../../src/types/tool';
import { WebviewCommand } from '../../src/types/messages';

describe('CatalogViewProvider', () => {
    let provider: CatalogViewProvider;
    let registryService: sinon.SinonStubbedInstance<RegistryService>;
    let statusDetector: sinon.SinonStubbedInstance<StatusDetector>;
    let extensionUri: vscode.Uri;

    const mockTools: Tool[] = [
        {
            id: 'test-ext',
            name: 'Test Extension',
            description: 'A test extension',
            category: 'Extensions',
            type: 'extension',
            version: '1.0.0',
            registrySource: { extensionId: 'test.ext', vsixPath: 'test/path.vsix' },
        },
        {
            id: 'test-npm',
            name: 'Test NPM',
            description: 'A test npm package',
            category: 'CLI Tools',
            type: 'npm',
            version: '2.0.0',
            registrySource: { packageName: '@test/cli', dependencyType: 'devDependencies' as const },
        },
    ];

    beforeEach(() => {
        sinon.restore();
        extensionUri = vscode.Uri.file('/mock/extension');

        registryService = sinon.createStubInstance(RegistryService);
        registryService.loadRegistry.resolves({
            version: '1.0.0',
            tools: mockTools,
        });

        statusDetector = sinon.createStubInstance(StatusDetector);
        const statusMap = new Map<string, ToolStatus>();
        statusMap.set('test-ext', 'installed');
        statusMap.set('test-npm', 'not-installed');
        statusDetector.detectAllStatuses.resolves(statusMap);

        provider = new CatalogViewProvider(
            extensionUri,
            registryService as unknown as RegistryService,
            statusDetector as unknown as StatusDetector
        );
    });

    describe('resolveWebviewView', () => {
        it('should set HTML content with CSP and nonce', () => {
            const mockView = vscode.createMockWebviewView();
            const context: vscode.WebviewViewResolveContext = { state: undefined };
            const token: vscode.CancellationToken = {
                isCancellationRequested: false,
                onCancellationRequested: () => ({ dispose: () => {} }),
            };

            provider.resolveWebviewView(mockView, context, token);

            const html = mockView.webview.html;
            assert.ok(html.includes('Content-Security-Policy'), 'HTML should include CSP');
            assert.ok(/nonce-[a-zA-Z0-9]+/.test(html), 'HTML should include nonce');
            assert.ok(html.includes('<input'), 'HTML should include search input');
        });

        it('should enable scripts in webview options', () => {
            const mockView = vscode.createMockWebviewView();
            const context: vscode.WebviewViewResolveContext = { state: undefined };
            const token: vscode.CancellationToken = {
                isCancellationRequested: false,
                onCancellationRequested: () => ({ dispose: () => {} }),
            };

            provider.resolveWebviewView(mockView, context, token);

            assert.strictEqual(mockView.webview.options.enableScripts, true);
        });
    });

    describe('refresh', () => {
        it('should post updateCatalog message to webview with tool data', async () => {
            const mockView = vscode.createMockWebviewView();
            const context: vscode.WebviewViewResolveContext = { state: undefined };
            const token: vscode.CancellationToken = {
                isCancellationRequested: false,
                onCancellationRequested: () => ({ dispose: () => {} }),
            };

            provider.resolveWebviewView(mockView, context, token);
            await provider.refresh();

            const messages = mockView.webview.getPostedMessages();
            assert.ok(messages.length > 0, 'Should have posted at least one message');

            const catalogMsg = messages.find(
                (m: unknown) => (m as { type: string }).type === 'updateCatalog'
            ) as { type: string; tools: { tool: Tool; status: ToolStatus }[] } | undefined;

            assert.ok(catalogMsg, 'Should have posted updateCatalog message');
            assert.strictEqual(catalogMsg!.tools.length, 2);
            assert.strictEqual(catalogMsg!.tools[0].tool.id, 'test-ext');
            assert.strictEqual(catalogMsg!.tools[0].status, 'installed');
            assert.strictEqual(catalogMsg!.tools[1].tool.id, 'test-npm');
            assert.strictEqual(catalogMsg!.tools[1].status, 'not-installed');
        });
    });

    describe('onDidReceiveCommand', () => {
        it('should fire onDidReceiveCommand when webview sends install message', () => {
            const mockView = vscode.createMockWebviewView();
            const context: vscode.WebviewViewResolveContext = { state: undefined };
            const token: vscode.CancellationToken = {
                isCancellationRequested: false,
                onCancellationRequested: () => ({ dispose: () => {} }),
            };

            provider.resolveWebviewView(mockView, context, token);

            const receivedCommands: WebviewCommand[] = [];
            provider.onDidReceiveCommand((cmd: WebviewCommand) => {
                receivedCommands.push(cmd);
            });

            mockView.webview.simulateMessage({ type: 'install', toolId: 'test-ext' });

            assert.strictEqual(receivedCommands.length, 1);
            assert.strictEqual(receivedCommands[0].command, 'install');
            assert.strictEqual(receivedCommands[0].toolId, 'test-ext');
        });

        it('should fire onDidReceiveCommand for update message', () => {
            const mockView = vscode.createMockWebviewView();
            const context: vscode.WebviewViewResolveContext = { state: undefined };
            const token: vscode.CancellationToken = {
                isCancellationRequested: false,
                onCancellationRequested: () => ({ dispose: () => {} }),
            };

            provider.resolveWebviewView(mockView, context, token);

            const receivedCommands: WebviewCommand[] = [];
            provider.onDidReceiveCommand((cmd: WebviewCommand) => {
                receivedCommands.push(cmd);
            });

            mockView.webview.simulateMessage({ type: 'update', toolId: 'test-npm' });

            assert.strictEqual(receivedCommands.length, 1);
            assert.strictEqual(receivedCommands[0].command, 'update');
            assert.strictEqual(receivedCommands[0].toolId, 'test-npm');
        });

        it('should trigger refresh when webview sends refresh message', () => {
            const mockView = vscode.createMockWebviewView();
            const context: vscode.WebviewViewResolveContext = { state: undefined };
            const token: vscode.CancellationToken = {
                isCancellationRequested: false,
                onCancellationRequested: () => ({ dispose: () => {} }),
            };

            provider.resolveWebviewView(mockView, context, token);

            mockView.webview.simulateMessage({ type: 'refresh' });

            assert.ok(registryService.loadRegistry.called, 'Should have called loadRegistry on refresh');
        });
    });
});
