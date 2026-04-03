import * as vscode from 'vscode';
import { ToolRegistry } from '../types/registry';
import { isToolRegistry } from './typeGuards';
import { CACHE_FILE } from '../constants';

export async function writeCache(storageUri: vscode.Uri, registry: ToolRegistry): Promise<void> {
    const cacheUri = vscode.Uri.joinPath(storageUri, CACHE_FILE);
    const data = Buffer.from(JSON.stringify(registry, null, 2));
    await vscode.workspace.fs.writeFile(cacheUri, data);
}

export async function readCache(storageUri: vscode.Uri): Promise<ToolRegistry | undefined> {
    try {
        const cacheUri = vscode.Uri.joinPath(storageUri, CACHE_FILE);
        const data = await vscode.workspace.fs.readFile(cacheUri);
        const parsed: unknown = JSON.parse(Buffer.from(data).toString());
        if (isToolRegistry(parsed)) {
            return parsed;
        }
        return undefined;
    } catch {
        return undefined;
    }
}
