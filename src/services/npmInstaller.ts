import * as vscode from 'vscode';
import { spawn as nodeSpawn, ChildProcess } from 'child_process';
import { Tool, NpmSource } from '../types/tool';
import { OperationResult } from '../types/operations';

export type SpawnFn = (command: string, args: string[], options: { cwd: string; shell: boolean }) => ChildProcess;

export class NpmInstaller {
    private readonly spawnFn: SpawnFn;

    constructor(spawnFn?: SpawnFn) {
        this.spawnFn = spawnFn || nodeSpawn;
    }
    canHandle(tool: Tool): boolean {
        return tool.type === 'npm';
    }

    async install(
        tool: Tool,
        progress: vscode.Progress<{ message?: string; increment?: number }>,
        token: vscode.CancellationToken
    ): Promise<OperationResult> {
        const source = tool.registrySource as NpmSource;
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

        if (!workspaceFolder) {
            return this.createResult(tool, false, 'No workspace folder open. Open a workspace to install npm packages.');
        }

        const saveFlag = source.dependencyType === 'devDependencies' ? '--save-dev' : '--save';
        const packageSpec = `${source.packageName}@${tool.version}`;

        progress.report({ message: `Installing ${packageSpec}...` });

        try {
            await this.runNpmInstall(packageSpec, saveFlag, workspaceFolder.uri.fsPath, progress, token);
            return this.createResult(tool, true, `${tool.name} v${tool.version} installed successfully`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return this.createResult(tool, false, `Failed to install ${tool.name}: ${message}`);
        }
    }

    private runNpmInstall(
        packageSpec: string,
        saveFlag: string,
        cwd: string,
        progress: vscode.Progress<{ message?: string; increment?: number }>,
        token: vscode.CancellationToken
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const args = ['install', packageSpec, saveFlag];
            const proc: ChildProcess = this.spawnFn('npm', args, { cwd, shell: true });

            proc.stdout?.on('data', (data: Buffer) => {
                progress.report({ message: data.toString().trim() });
            });

            let stderr = '';
            proc.stderr?.on('data', (data: Buffer) => {
                stderr += data.toString();
            });

            proc.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`npm install exited with code ${code}: ${stderr.trim()}`));
                }
            });

            proc.on('error', (err) => {
                reject(err);
            });

            token.onCancellationRequested(() => {
                proc.kill();
                reject(new Error('Installation cancelled'));
            });
        });
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
