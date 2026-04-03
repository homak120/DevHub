import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Tool, ExtensionSource, NpmSource, ArtifactorySource } from '../types/tool';
import { ToolStatus } from '../types/operations';

export class StatusDetector {
    async detectStatus(tool: Tool): Promise<ToolStatus> {
        if (tool.deprecated) {
            return 'deprecated';
        }

        switch (tool.type) {
            case 'extension':
                return this.detectExtensionStatus(tool);
            case 'npm':
                return this.detectNpmStatus(tool);
            case 'artifactory':
                return this.detectArtifactoryStatus(tool);
        }
    }

    async detectAllStatuses(tools: Tool[]): Promise<Map<string, ToolStatus>> {
        const statuses = new Map<string, ToolStatus>();
        for (const tool of tools) {
            const status = await this.detectStatus(tool);
            statuses.set(tool.id, status);
        }
        return statuses;
    }

    private detectExtensionStatus(tool: Tool): ToolStatus {
        const source = tool.registrySource as ExtensionSource;
        const installed = vscode.extensions.all.find(
            (ext) => ext.id.toLowerCase() === source.extensionId.toLowerCase()
        );

        if (!installed) {
            return 'not-installed';
        }

        const installedVersion = installed.packageJSON?.version;
        if (installedVersion && installedVersion !== tool.version) {
            return 'update-available';
        }

        return 'installed';
    }

    private detectNpmStatus(tool: Tool): ToolStatus {
        const source = tool.registrySource as NpmSource;
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

        if (!workspaceFolder) {
            return 'not-installed';
        }

        try {
            const packageJsonPath = path.join(
                workspaceFolder.uri.fsPath,
                'node_modules',
                ...source.packageName.split('/'),
                'package.json'
            );

            if (fs.existsSync(packageJsonPath)) {
                const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                if (pkg.version !== tool.version) {
                    return 'update-available';
                }
                return 'installed';
            }
        } catch {
            // Fall through to not-installed
        }

        return 'not-installed';
    }

    private detectArtifactoryStatus(tool: Tool): ToolStatus {
        const source = tool.registrySource as ArtifactorySource;
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

        if (!workspaceFolder) {
            return 'not-installed';
        }

        const targetPath = path.join(workspaceFolder.uri.fsPath, source.targetPath);
        if (fs.existsSync(targetPath)) {
            return 'installed';
        }

        return 'not-installed';
    }
}
