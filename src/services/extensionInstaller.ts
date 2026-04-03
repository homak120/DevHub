import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Tool, ExtensionSource } from '../types/tool';
import { OperationResult } from '../types/operations';
import { CONFIG_KEYS } from '../constants';

export class ExtensionInstaller {
    canHandle(tool: Tool): boolean {
        return tool.type === 'extension';
    }

    async install(
        tool: Tool,
        progress: vscode.Progress<{ message?: string; increment?: number }>,
        token: vscode.CancellationToken
    ): Promise<OperationResult> {
        const source = tool.registrySource as ExtensionSource;
        const baseUrl = vscode.workspace.getConfiguration().get<string>(CONFIG_KEYS.artifactoryBaseUrl) || '';
        const url = `${baseUrl}/${source.vsixPath}`;
        const tempDir = os.tmpdir();
        const tempFile = path.join(tempDir, `${tool.id}-${tool.version}.vsix`);

        try {
            progress.report({ message: `Downloading ${tool.name}...` });

            if (token.isCancellationRequested) {
                return this.createResult(tool, false, 'Installation cancelled');
            }

            await this.downloadFile(url, tempFile, token);

            if (token.isCancellationRequested) {
                this.cleanup(tempFile);
                return this.createResult(tool, false, 'Installation cancelled');
            }

            progress.report({ message: `Installing ${tool.name}...` });
            const vsixUri = vscode.Uri.file(tempFile);
            await vscode.commands.executeCommand(
                'workbench.extensions.installExtension',
                vsixUri
            );

            this.cleanup(tempFile);
            return this.createResult(tool, true, `${tool.name} v${tool.version} installed successfully`);
        } catch (error) {
            this.cleanup(tempFile);
            const message = error instanceof Error ? error.message : 'Unknown error';
            return this.createResult(tool, false, `Failed to install ${tool.name}: ${message}`);
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
            action: 'install',
            success,
            message,
            timestamp: Date.now(),
        };
    }
}
