// Mock vscode module for unit tests running outside VS Code

export interface Disposable {
    dispose(): void;
}

export type Event<T> = (listener: (e: T) => void) => Disposable;

export interface Progress<T> {
    report(value: T): void;
}

export interface CancellationToken {
    isCancellationRequested: boolean;
    onCancellationRequested: Event<void>;
}

export interface TreeDataProvider<T> {
    onDidChangeTreeData?: Event<T | undefined | null | void>;
    getTreeItem(element: T): TreeItem;
    getChildren(element?: T): ProviderResult<T[]>;
}

export type ProviderResult<T> = T | undefined | null | PromiseLike<T | undefined | null>;

export class EventEmitter<T> {
    private listeners: ((e: T) => void)[] = [];

    event = (listener: (e: T) => void) => {
        this.listeners.push(listener);
        return { dispose: () => { this.listeners = this.listeners.filter(l => l !== listener); } };
    };

    fire(data: T): void {
        this.listeners.forEach(l => l(data));
    }

    dispose(): void {
        this.listeners = [];
    }
}

export enum TreeItemCollapsibleState {
    None = 0,
    Collapsed = 1,
    Expanded = 2,
}

export class TreeItem {
    label?: string;
    description?: string;
    tooltip?: string;
    contextValue?: string;
    collapsibleState?: TreeItemCollapsibleState;
    iconPath?: unknown;
    command?: unknown;

    constructor(label: string, collapsibleState?: TreeItemCollapsibleState) {
        this.label = label;
        this.collapsibleState = collapsibleState;
    }
}

export class ThemeIcon {
    constructor(public readonly id: string) {}
}

export class Uri {
    readonly fsPath: string;
    readonly scheme: string;
    readonly path: string;

    private constructor(fsPath: string) {
        this.fsPath = fsPath;
        this.scheme = 'file';
        this.path = fsPath;
    }

    static file(filePath: string): Uri {
        const uri = new Uri(filePath);
        return uri;
    }

    static joinPath(base: Uri, ...pathSegments: string[]): Uri {
        const joined = [base.fsPath, ...pathSegments].join('/');
        return new Uri(joined);
    }

    toString(): string {
        return this.fsPath;
    }
}

export const workspace = {
    fs: {
        readFile: async (_uri: Uri): Promise<Uint8Array> => Buffer.from('{}'),
        writeFile: async (_uri: Uri, _content: Uint8Array): Promise<void> => {},
        stat: async (_uri: Uri) => ({ type: 1, ctime: 0, mtime: 0, size: 0 }),
    },
    workspaceFolders: undefined as { uri: Uri }[] | undefined,
    getConfiguration: () => ({
        get: <T>(_key: string, defaultValue?: T): T | undefined => defaultValue,
    }),
};

export interface WebviewOptions {
    enableScripts?: boolean;
    localResourceRoots?: Uri[];
}

export class MockWebview {
    options: WebviewOptions = {};
    html = '';
    cspSource = 'https://mock.csp.source';
    private _onDidReceiveMessage = new EventEmitter<unknown>();
    onDidReceiveMessage: Event<unknown> = this._onDidReceiveMessage.event;
    private _postedMessages: unknown[] = [];

    asWebviewUri(uri: Uri): Uri {
        return Uri.file(`https://webview.mock/${uri.fsPath}`);
    }

    postMessage(message: unknown): PromiseLike<boolean> {
        this._postedMessages.push(message);
        return Promise.resolve(true);
    }

    // Test helper: get all posted messages
    getPostedMessages(): unknown[] {
        return this._postedMessages;
    }

    // Test helper: simulate receiving a message from webview
    simulateMessage(message: unknown): void {
        this._onDidReceiveMessage.fire(message);
    }
}

export interface WebviewView {
    webview: MockWebview;
    viewType: string;
    title?: string;
    description?: string;
    visible: boolean;
    onDidDispose: Event<void>;
    onDidChangeVisibility: Event<void>;
    show(preserveFocus?: boolean): void;
}

export interface WebviewViewResolveContext<T = unknown> {
    state: T | undefined;
}

export interface WebviewViewProvider {
    resolveWebviewView(
        webviewView: WebviewView,
        context: WebviewViewResolveContext,
        token: CancellationToken
    ): void | PromiseLike<void>;
}

export function createMockWebviewView(): WebviewView {
    const webview = new MockWebview();
    const disposeEmitter = new EventEmitter<void>();
    const visibilityEmitter = new EventEmitter<void>();
    return {
        webview,
        viewType: 'aepDevHub.toolCatalog',
        visible: true,
        onDidDispose: disposeEmitter.event,
        onDidChangeVisibility: visibilityEmitter.event,
        show: () => {},
    };
}

export const window = {
    withProgress: async <T>(
        _options: unknown,
        task: (progress: unknown, token: unknown) => Promise<T>
    ): Promise<T> => {
        const progress = { report: () => {} };
        const token = { isCancellationRequested: false, onCancellationRequested: () => ({ dispose: () => {} }) };
        return task(progress, token);
    },
    showInformationMessage: async () => undefined,
    showErrorMessage: async () => undefined,
    showWarningMessage: async (..._args: unknown[]) => undefined,
    createTreeView: () => ({ dispose: () => {} }),
    registerWebviewViewProvider: (_viewId: string, _provider: WebviewViewProvider) => ({ dispose: () => {} }),
};

export const commands = {
    executeCommand: async (..._args: unknown[]) => undefined,
    registerCommand: (_command: string, _callback: (...args: unknown[]) => unknown) => ({ dispose: () => {} }),
};

export const extensions = {
    all: [] as { id: string; packageJSON: { version: string } }[],
};

export const ProgressLocation = {
    Notification: 15,
    Window: 10,
};

export class CancellationTokenSource {
    token = {
        isCancellationRequested: false,
        onCancellationRequested: () => ({ dispose: () => {} }),
    };
    cancel(): void {
        this.token.isCancellationRequested = true;
    }
    dispose(): void {}
}
