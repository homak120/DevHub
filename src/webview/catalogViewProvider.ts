import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { RegistryService } from '../services/registryService';
import { StatusDetector } from '../services/statusDetector';
import { getWebviewContent } from './getWebviewContent';
import { ExtensionToWebviewMessage, WebviewCommand, WebviewToExtensionMessage } from '../types/messages';

export class CatalogViewProvider implements vscode.WebviewViewProvider {
    private _view: vscode.WebviewView | undefined;
    private readonly _onDidReceiveCommand = new vscode.EventEmitter<WebviewCommand>();
    readonly onDidReceiveCommand: vscode.Event<WebviewCommand> = this._onDidReceiveCommand.event;

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly registryService: RegistryService,
        private readonly statusDetector: StatusDetector
    ) {}

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri],
        };

        const nonce = crypto.randomBytes(16).toString('hex');
        webviewView.webview.html = getWebviewContent(webviewView.webview, this.extensionUri, nonce);

        webviewView.webview.onDidReceiveMessage((message: unknown) => {
            this._handleMessage(message as WebviewToExtensionMessage);
        });
    }

    async refresh(): Promise<void> {
        if (!this._view) {
            return;
        }

        try {
            const registry = await this.registryService.loadRegistry();
            const statuses = await this.statusDetector.detectAllStatuses(registry.tools);

            const tools = registry.tools.map(tool => ({
                tool,
                status: statuses.get(tool.id) || 'not-installed' as const,
            }));

            const message: ExtensionToWebviewMessage = {
                type: 'updateCatalog',
                tools,
            };
            await this._view.webview.postMessage(message);
        } catch (err) {
            const errorMsg: ExtensionToWebviewMessage = {
                type: 'error',
                message: err instanceof Error ? err.message : 'Failed to load tool catalog',
            };
            await this._view.webview.postMessage(errorMsg);
        }
    }

    async updateToolStatus(toolId: string, status: import('../types/operations').ToolStatus): Promise<void> {
        if (!this._view) {
            return;
        }
        const message: ExtensionToWebviewMessage = {
            type: 'updateToolStatus',
            toolId,
            status,
        };
        await this._view.webview.postMessage(message);
    }

    private _handleMessage(message: WebviewToExtensionMessage): void {
        switch (message.type) {
            case 'install':
            case 'update':
            case 'open':
            case 'retry':
                this._onDidReceiveCommand.fire({
                    command: message.type,
                    toolId: message.toolId,
                });
                break;
            case 'refresh':
                this.refresh();
                break;
            case 'search':
                // Search is handled client-side in the webview
                break;
        }
    }

    dispose(): void {
        this._onDidReceiveCommand.dispose();
    }
}
