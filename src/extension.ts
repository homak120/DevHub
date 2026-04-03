import * as vscode from 'vscode';
import { CatalogViewProvider } from './webview/catalogViewProvider';
import { RegistryService } from './services/registryService';
import { StatusDetector } from './services/statusDetector';
import { OperationQueue } from './services/operationQueue';
import { ExtensionInstaller } from './services/extensionInstaller';
import { NpmInstaller } from './services/npmInstaller';
import { ArtifactoryPuller } from './services/artifactoryPuller';
import { Tool } from './types/tool';
import { VIEW_ID, COMMANDS } from './constants';
import { OperationResult } from './types/operations';
import { WebviewCommand } from './types/messages';

export function activate(context: vscode.ExtensionContext): void {
    const registryService = new RegistryService(context.globalStorageUri);
    const statusDetector = new StatusDetector();
    const catalogViewProvider = new CatalogViewProvider(
        context.extensionUri,
        registryService,
        statusDetector
    );
    const operationQueue = new OperationQueue();
    const extensionInstaller = new ExtensionInstaller();
    const npmInstaller = new NpmInstaller();
    const artifactoryPuller = new ArtifactoryPuller();

    // Register WebviewViewProvider for the sidebar
    const viewProvider = vscode.window.registerWebviewViewProvider(
        VIEW_ID,
        catalogViewProvider
    );

    const refreshCommand = vscode.commands.registerCommand(
        COMMANDS.refreshCatalog,
        () => catalogViewProvider.refresh()
    );

    function findToolById(toolId: string): Tool | undefined {
        const registry = registryService.getCachedRegistry();
        if (!registry) { return undefined; }
        return registry.tools.find(t => t.id === toolId);
    }

    function enqueueInstall(tool: Tool, action: 'install' | 'update' | 'pull'): void {
        catalogViewProvider.updateToolStatus(tool.id, 'queued');

        operationQueue.enqueue(
            { toolId: tool.id, action, timestamp: Date.now() },
            async (): Promise<OperationResult> => {
                await catalogViewProvider.updateToolStatus(tool.id, 'in-progress');

                return vscode.window.withProgress(
                    {
                        location: vscode.ProgressLocation.Notification,
                        title: `${action === 'pull' ? 'Pulling' : 'Installing'} ${tool.name}`,
                        cancellable: true,
                    },
                    async (progress, token) => {
                        let result: OperationResult;

                        if (extensionInstaller.canHandle(tool)) {
                            result = await extensionInstaller.install(tool, progress, token);
                        } else if (npmInstaller.canHandle(tool)) {
                            result = await npmInstaller.install(tool, progress, token);
                        } else if (artifactoryPuller.canHandle(tool)) {
                            result = await artifactoryPuller.install(tool, progress, token);
                        } else {
                            result = {
                                toolId: tool.id,
                                action,
                                success: false,
                                message: `No installer available for tool type: ${tool.type}`,
                                timestamp: Date.now(),
                            };
                        }

                        if (result.success) {
                            vscode.window.showInformationMessage(result.message);
                        } else {
                            vscode.window.showErrorMessage(result.message);
                        }

                        await catalogViewProvider.refresh();
                        return result;
                    }
                );
            }
        );
    }

    // Handle commands from the webview
    const commandSubscription = catalogViewProvider.onDidReceiveCommand((cmd: WebviewCommand) => {
        const tool = findToolById(cmd.toolId);
        if (!tool) { return; }

        switch (cmd.command) {
            case 'install':
                enqueueInstall(tool, 'install');
                break;
            case 'update':
                enqueueInstall(tool, 'update');
                break;
            case 'retry':
                enqueueInstall(tool, 'install');
                break;
            case 'open':
                if (tool.type === 'extension') {
                    const source = tool.registrySource as { extensionId: string };
                    vscode.commands.executeCommand(
                        'workbench.extensions.action.showExtensionEditor',
                        source.extensionId
                    );
                } else if (tool.type === 'artifactory') {
                    const source = tool.registrySource as { targetPath: string };
                    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                    if (workspaceFolder) {
                        const targetUri = vscode.Uri.joinPath(workspaceFolder.uri, source.targetPath);
                        vscode.commands.executeCommand('revealInExplorer', targetUri);
                    }
                }
                break;
        }
    });

    // Register commands for toolbar/context menu (still usable from command palette)
    const installCommand = vscode.commands.registerCommand(
        COMMANDS.installTool,
        (toolId: string) => {
            const tool = findToolById(toolId);
            if (tool) { enqueueInstall(tool, 'install'); }
        }
    );

    const updateCommand = vscode.commands.registerCommand(
        COMMANDS.updateTool,
        (toolId: string) => {
            const tool = findToolById(toolId);
            if (tool) { enqueueInstall(tool, 'update'); }
        }
    );

    const retryCommand = vscode.commands.registerCommand(
        COMMANDS.retryOperation,
        (toolId: string) => {
            const tool = findToolById(toolId);
            if (tool) { enqueueInstall(tool, 'install'); }
        }
    );

    const openCommand = vscode.commands.registerCommand(
        COMMANDS.openTool,
        async (toolId: string) => {
            const tool = findToolById(toolId);
            if (!tool) { return; }

            if (tool.type === 'extension') {
                const source = tool.registrySource as { extensionId: string };
                await vscode.commands.executeCommand(
                    'workbench.extensions.action.showExtensionEditor',
                    source.extensionId
                );
            } else if (tool.type === 'artifactory') {
                const source = tool.registrySource as { targetPath: string };
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (workspaceFolder) {
                    const targetUri = vscode.Uri.joinPath(workspaceFolder.uri, source.targetPath);
                    await vscode.commands.executeCommand('revealInExplorer', targetUri);
                }
            }
        }
    );

    context.subscriptions.push(
        viewProvider,
        refreshCommand,
        installCommand,
        updateCommand,
        retryCommand,
        openCommand,
        commandSubscription,
        operationQueue
    );
}

export function deactivate(): void {
    // Cleanup handled by disposables
}
