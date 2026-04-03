import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Tool, ArtifactorySource } from '../types/tool';
import { OperationResult } from '../types/operations';
import { CONFIG_KEYS } from '../constants';

export class ArtifactoryPuller {
    canHandle(tool: Tool): boolean {
        return tool.type === 'artifactory';
    }

    async install(
        tool: Tool,
        progress: vscode.Progress<{ message?: string; increment?: number }>,
        token: vscode.CancellationToken
    ): Promise<OperationResult> {
        const source = tool.registrySource as ArtifactorySource;
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

        if (!workspaceFolder) {
            return this.createResult(tool, false, 'No workspace folder open. Open a workspace to pull artifacts.');
        }

        const baseUrl = vscode.workspace.getConfiguration().get<string>(CONFIG_KEYS.artifactoryBaseUrl) || '';
        const url = `${baseUrl}/${source.repository}/${source.artifactPath}`;
        const targetDir = path.join(workspaceFolder.uri.fsPath, source.targetPath);
        const fileName = path.basename(source.artifactPath);
        const targetFile = path.join(targetDir, fileName);
        const tempFile = path.join(os.tmpdir(), `${tool.id}-${Date.now()}-${fileName}`);

        try {
            // Check if target exists and prompt for overwrite
            if (fs.existsSync(targetFile)) {
                const overwrite = await vscode.window.showWarningMessage(
                    `${fileName} already exists at ${source.targetPath}. Overwrite?`,
                    'Overwrite',
                    'Cancel'
                );
                if (overwrite !== 'Overwrite') {
                    return this.createResult(tool, false, 'Pull cancelled by user');
                }
            }

            progress.report({ message: `Downloading ${tool.name}...` });

            if (token.isCancellationRequested) {
                return this.createResult(tool, false, 'Pull cancelled');
            }

            await this.downloadFile(url, tempFile, token);

            if (token.isCancellationRequested) {
                this.cleanup(tempFile);
                return this.createResult(tool, false, 'Pull cancelled');
            }

            // Atomic write: ensure target directory exists, then rename
            progress.report({ message: `Placing ${fileName} at ${source.targetPath}...` });
            fs.mkdirSync(targetDir, { recursive: true });
            fs.copyFileSync(tempFile, targetFile);
            this.cleanup(tempFile);

            return this.createResult(tool, true, `${tool.name} v${tool.version} pulled to ${source.targetPath}`);
        } catch (error) {
            this.cleanup(tempFile);
            const message = error instanceof Error ? error.message : 'Unknown error';
            return this.createResult(tool, false, `Failed to pull ${tool.name}: ${message}`);
        }
    }

    private downloadFile(url: string, dest: string, token: vscode.CancellationToken): Promise<void> {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https') ? https : http;
            const file = fs.createWriteStream(dest);

            const request = protocol.get(url, (response) => {
                if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    file.close();
                    fs.unlinkSync(dest);
                    this.downloadFile(response.headers.location, dest, token).then(resolve, reject);
                    return;
                }

                if (response.statusCode && response.statusCode !== 200) {
                    file.close();
                    fs.unlinkSync(dest);
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }

                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            });

            request.on('error', (err) => {
                file.close();
                fs.unlink(dest, () => {});
                reject(err);
            });

            token.onCancellationRequested(() => {
                request.destroy();
                file.close();
                fs.unlink(dest, () => {});
                reject(new Error('Download cancelled'));
            });
        });
    }

    private cleanup(filePath: string): void {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch {
            // Best effort cleanup
        }
    }

    private createResult(tool: Tool, success: boolean, message: string): OperationResult {
        return {
            toolId: tool.id,
            action: 'pull',
            success,
            message,
            timestamp: Date.now(),
        };
    }
}
