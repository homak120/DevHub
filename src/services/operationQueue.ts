import * as vscode from 'vscode';
import { OperationRequest, OperationResult } from '../types/operations';

type OperationHandler = () => Promise<OperationResult>;

interface QueueEntry {
    request: OperationRequest;
    handler: OperationHandler;
}

export class OperationQueue implements vscode.Disposable {
    private readonly queue: QueueEntry[] = [];
    private currentEntry: QueueEntry | undefined;
    private processing = false;
    private readonly _onDidChange = new vscode.EventEmitter<void>();

    readonly onDidChange: vscode.Event<void> = this._onDidChange.event;

    get length(): number {
        return this.queue.length + (this.currentEntry ? 1 : 0);
    }

    get current(): OperationRequest | undefined {
        return this.currentEntry?.request;
    }

    enqueue(request: OperationRequest, handler: OperationHandler): number {
        const position = this.queue.length;
        this.queue.push({ request, handler });
        this._onDidChange.fire();
        this.processNext();
        return position;
    }

    private async processNext(): Promise<void> {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;
        const entry = this.queue.shift()!;
        this.currentEntry = entry;
        this._onDidChange.fire();

        try {
            await entry.handler();
        } catch {
            // Error handling is in the handler itself
        } finally {
            this.currentEntry = undefined;
            this.processing = false;
            this._onDidChange.fire();
            this.processNext();
        }
    }

    dispose(): void {
        this._onDidChange.dispose();
    }
}
