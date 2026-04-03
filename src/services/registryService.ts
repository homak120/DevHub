import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ToolRegistry } from '../types/registry';
import { isToolRegistry } from '../utils/typeGuards';
import { writeCache, readCache } from '../utils/cache';
import { REGISTRY_FILE } from '../constants';

export class RegistryService {
    private cachedRegistry: ToolRegistry | undefined;
    private _isOffline = false;

    constructor(private readonly storageUri: vscode.Uri) {}

    get isOffline(): boolean {
        return this._isOffline;
    }

    async loadRegistry(): Promise<ToolRegistry> {
        try {
            const registryPath = path.join(__dirname, '..', '..', 'data', REGISTRY_FILE);
            const raw = fs.readFileSync(registryPath, 'utf8');
            const parsed: unknown = JSON.parse(raw);

            if (!isToolRegistry(parsed)) {
                throw new Error('Invalid registry format');
            }

            this._isOffline = false;
            this.cachedRegistry = parsed;
            // Cache for offline use (fire and forget)
            writeCache(this.storageUri, parsed).catch(() => {});
            return parsed;
        } catch (error) {
            // Fallback to cached registry
            const cached = await readCache(this.storageUri);
            if (cached) {
                this._isOffline = true;
                this.cachedRegistry = cached;
                return cached;
            }
            throw error;
        }
    }

    getCachedRegistry(): ToolRegistry | undefined {
        return this.cachedRegistry;
    }
}
