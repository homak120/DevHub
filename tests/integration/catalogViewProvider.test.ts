import { strict as assert } from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { CatalogViewProvider } from '../../src/webview/catalogViewProvider';
import { RegistryService } from '../../src/services/registryService';
import { StatusDetector } from '../../src/services/statusDetector';
import { ToolStatus } from '../../src/types/operations';
import { WebviewCommand } from '../../src/types/messages';

describe('CatalogViewProvider (integration)', () => {
    let provider: CatalogViewProvider;
    let registryService: RegistryService;
    let statusDetector: StatusDetector;
    const mockStorageUri = vscode.Uri.file('/tmp/test-storage');
    const extensionUri = vscode.Uri.file('/mock/extension');

    beforeEach(async () => {
        registryService = new RegistryService(mockStorageUri);
        statusDetector = new StatusDetector();
        (vscode.extensions as { all: { id: string; packageJSON: { version: string } }[] }).all = [];
        provider = new CatalogViewProvider(extensionUri, registryService, statusDetector);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should resolve webview view and set HTML with catalog structure', () => {
        const mockView = vscode.createMockWebviewView();
        const context: vscode.WebviewViewResolveContext = { state: undefined };
        const token: vscode.CancellationToken = {
            isCancellationRequested: false,
            onCancellationRequested: () => ({ dispose: () => {} }),
        };

        provider.resolveWebviewView(mockView, context, token);

        const html = mockView.webview.html;
        assert.ok(html.includes('<!DOCTYPE html>'), 'Should be valid HTML');
        assert.ok(html.includes('installed-section'), 'Should have installed section');
        assert.ok(html.includes('available-section'), 'Should have available section');
        assert.ok(html.includes('search-input'), 'Should have search input');
        assert.strictEqual(mockView.webview.options.enableScripts, true);
    });

    it('should load real registry data and post to webview on refresh', async () => {
        const mockView = vscode.createMockWebviewView();
        const context: vscode.WebviewViewResolveContext = { state: undefined };
        const token: vscode.CancellationToken = {
            isCancellationRequested: false,
            onCancellationRequested: () => ({ dispose: () => {} }),
        };

        provider.resolveWebviewView(mockView, context, token);
        await provider.refresh();

        const messages = mockView.webview.getPostedMessages();
        const catalogMsg = messages.find(
            (m: unknown) => (m as { type: string }).type === 'updateCatalog'
        ) as { type: string; tools: { tool: { id: string }; status: ToolStatus }[] } | undefined;

        assert.ok(catalogMsg, 'Should have posted updateCatalog');
        assert.ok(catalogMsg!.tools.length > 0, 'Should have tools from registry');

        // Verify tools match the bundled registry (4 tools)
        const toolIds = catalogMsg!.tools.map(t => t.tool.id);
        assert.ok(toolIds.includes('aep-ui-copilot'), 'Should include AEP UI Copilot');
        assert.ok(toolIds.includes('farmfix-cli'), 'Should include FarmFix CLI');
    });

    it('should route install command from webview to onDidReceiveCommand', () => {
        const mockView = vscode.createMockWebviewView();
        const context: vscode.WebviewViewResolveContext = { state: undefined };
        const token: vscode.CancellationToken = {
            isCancellationRequested: false,
            onCancellationRequested: () => ({ dispose: () => {} }),
        };

        provider.resolveWebviewView(mockView, context, token);

        const commands: WebviewCommand[] = [];
        provider.onDidReceiveCommand(cmd => commands.push(cmd));

        // Simulate install message from webview
        mockView.webview.simulateMessage({ type: 'install', toolId: 'aep-ui-copilot' });

        assert.strictEqual(commands.length, 1);
        assert.strictEqual(commands[0].command, 'install');
        assert.strictEqual(commands[0].toolId, 'aep-ui-copilot');
    });

    it('should update individual tool status in webview', async () => {
        const mockView = vscode.createMockWebviewView();
        const context: vscode.WebviewViewResolveContext = { state: undefined };
        const token: vscode.CancellationToken = {
            isCancellationRequested: false,
            onCancellationRequested: () => ({ dispose: () => {} }),
        };

        provider.resolveWebviewView(mockView, context, token);

        await provider.updateToolStatus('aep-ui-copilot', 'in-progress');

        const messages = mockView.webview.getPostedMessages();
        const statusMsg = messages.find(
            (m: unknown) => (m as { type: string }).type === 'updateToolStatus'
        ) as { type: string; toolId: string; status: string } | undefined;

        assert.ok(statusMsg, 'Should have posted updateToolStatus');
        assert.strictEqual(statusMsg!.toolId, 'aep-ui-copilot');
        assert.strictEqual(statusMsg!.status, 'in-progress');
    });
});
