import * as vscode from 'vscode';

interface WebviewLike {
    asWebviewUri(uri: vscode.Uri): vscode.Uri;
    cspSource: string;
}

export function getWebviewContent(
    webview: WebviewLike,
    extensionUri: vscode.Uri,
    nonce: string
): string {
    const styleUri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionUri, 'resources', 'webview', 'catalog.css')
    );
    const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionUri, 'resources', 'webview', 'catalog.js')
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data:;">
    <link href="${styleUri}" rel="stylesheet">
    <title>AEP Dev Hub</title>
</head>
<body>
    <div class="catalog-container">
        <div class="search-container">
            <input type="text" id="search-input" class="search-input" placeholder="Search tools..." aria-label="Search tools">
        </div>
        <div class="catalog-sections">
            <div id="installed-section" class="section">
                <div class="section-header" data-section="installed">
                    <span class="section-toggle">&#9662;</span>
                    <span class="section-title">INSTALLED</span>
                    <span id="installed-count" class="section-badge">0</span>
                </div>
                <div id="installed-list" class="tool-list"></div>
            </div>
            <div id="available-section" class="section">
                <div class="section-header" data-section="available">
                    <span class="section-toggle">&#9662;</span>
                    <span class="section-title">AVAILABLE</span>
                    <span id="available-count" class="section-badge">0</span>
                </div>
                <div id="available-list" class="tool-list"></div>
            </div>
        </div>
        <div id="empty-state" class="empty-state" style="display:none;">
            <p>No tools found</p>
            <p class="empty-hint">Try clearing your search filter</p>
        </div>
        <div id="error-state" class="error-state" style="display:none;">
            <p id="error-message"></p>
            <button id="retry-button" class="action-button">Retry</button>
        </div>
    </div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}
