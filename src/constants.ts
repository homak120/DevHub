export const VIEW_ID = 'aepDevHub.toolCatalog';

export const COMMANDS = {
    refreshCatalog: 'aepDevHub.refreshCatalog',
    installTool: 'aepDevHub.installTool',
    updateTool: 'aepDevHub.updateTool',
    retryOperation: 'aepDevHub.retryOperation',
    openTool: 'aepDevHub.openTool',
} as const;

export const CONFIG_KEYS = {
    artifactoryBaseUrl: 'aepDevHub.artifactoryBaseUrl',
} as const;

export const REGISTRY_FILE = 'tool-registry.json';
export const CACHE_FILE = 'registry-cache.json';
