import { Tool } from './tool';
import { ToolStatus } from './operations';

// Extension → Webview messages
export type ExtensionToWebviewMessage =
    | { type: 'updateCatalog'; tools: ToolWithStatus[] }
    | { type: 'updateToolStatus'; toolId: string; status: ToolStatus }
    | { type: 'operationProgress'; toolId: string; message: string }
    | { type: 'error'; message: string };

// Webview → Extension messages
export type WebviewToExtensionMessage =
    | { type: 'install'; toolId: string }
    | { type: 'update'; toolId: string }
    | { type: 'open'; toolId: string }
    | { type: 'retry'; toolId: string }
    | { type: 'refresh' }
    | { type: 'search'; query: string };

export interface ToolWithStatus {
    tool: Tool;
    status: ToolStatus;
}

export interface WebviewCommand {
    command: 'install' | 'update' | 'open' | 'retry';
    toolId: string;
}
