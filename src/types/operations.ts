export interface OperationRequest {
    toolId: string;
    action: 'install' | 'update' | 'pull';
    timestamp: number;
}

export interface OperationResult {
    toolId: string;
    action: 'install' | 'update' | 'pull';
    success: boolean;
    message: string;
    timestamp: number;
}

export type ToolStatus =
    | 'not-installed'
    | 'installed'
    | 'update-available'
    | 'queued'
    | 'in-progress'
    | 'error'
    | 'deprecated';
