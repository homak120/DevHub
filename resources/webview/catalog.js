// @ts-check
// AEP Dev Hub - Catalog Webview Frontend
(function () {
    // @ts-ignore
    const vscode = acquireVsCodeApi();

    /** @type {{ tool: any, status: string }[]} */
    let allTools = [];

    /** @type {string} */
    let searchQuery = '';

    // DOM elements
    const searchInput = /** @type {HTMLInputElement} */ (document.getElementById('search-input'));
    const installedList = document.getElementById('installed-list');
    const availableList = document.getElementById('available-list');
    const installedCount = document.getElementById('installed-count');
    const availableCount = document.getElementById('available-count');
    const installedSection = document.getElementById('installed-section');
    const availableSection = document.getElementById('available-section');
    const emptyState = document.getElementById('empty-state');
    const errorState = document.getElementById('error-state');
    const retryButton = document.getElementById('retry-button');
    const errorMessage = document.getElementById('error-message');

    // SVG icons for tool types
    const typeIcons = {
        extension: '<svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 1H5.5L4 2.5V6H5V3H13V12H10V13H13.5L15 11.5V2.5L13.5 1ZM6 8.5V5L4.5 3.5H1.5L0 5V11.5L1.5 13H4.5L6 11.5V10H5V11H2V5.5H5V8.5H6Z"/></svg>',
        npm: '<svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor"><path d="M1 2H15V12H8V14H5V12H1V2ZM2 3V11H5V5H7V11H8V3H2ZM9 3V11H11V5H13V11H14V3H9Z"/></svg>',
        artifactory: '<svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1L1 5V11L8 15L15 11V5L8 1ZM8 2.5L13 5L8 7.5L3 5L8 2.5ZM2 6L7.5 8.75V13.5L2 10.75V6ZM14 6V10.75L8.5 13.5V8.75L14 6Z"/></svg>'
    };

    // Status display config
    const statusConfig = {
        'installed': { label: 'Installed', action: 'Open', actionType: 'open', cssClass: 'installed' },
        'not-installed': { label: '', action: 'Install', actionType: 'install', cssClass: '' },
        'update-available': { label: 'Update Available', action: 'Update', actionType: 'update', cssClass: 'update-available' },
        'queued': { label: 'Queued...', action: null, actionType: null, cssClass: 'queued' },
        'in-progress': { label: 'Installing...', action: null, actionType: null, cssClass: 'in-progress' },
        'error': { label: 'Error', action: 'Retry', actionType: 'retry', cssClass: 'error' },
        'deprecated': { label: 'Deprecated', action: null, actionType: null, cssClass: 'deprecated' }
    };

    /**
     * Render the tool catalog
     */
    function render() {
        const query = searchQuery.toLowerCase().trim();
        const filtered = allTools.filter(function (item) {
            if (!query) return true;
            return (
                item.tool.name.toLowerCase().includes(query) ||
                item.tool.description.toLowerCase().includes(query) ||
                item.tool.category.toLowerCase().includes(query)
            );
        });

        const installed = filtered.filter(function (item) {
            return item.status === 'installed' || item.status === 'update-available';
        });
        const available = filtered.filter(function (item) {
            return item.status !== 'installed' && item.status !== 'update-available';
        });

        if (installedList) installedList.innerHTML = installed.map(renderToolCard).join('');
        if (availableList) availableList.innerHTML = available.map(renderToolCard).join('');
        if (installedCount) installedCount.textContent = String(installed.length);
        if (availableCount) availableCount.textContent = String(available.length);

        // Show/hide sections
        if (installedSection) installedSection.style.display = installed.length > 0 ? '' : 'none';
        if (availableSection) availableSection.style.display = available.length > 0 ? '' : 'none';

        // Empty state
        if (emptyState) {
            emptyState.style.display = (filtered.length === 0 && allTools.length > 0) ? '' : 'none';
        }
        if (errorState) {
            errorState.style.display = 'none';
        }
    }

    /**
     * Render a single tool card
     * @param {{ tool: any, status: string }} item
     * @returns {string}
     */
    function renderToolCard(item) {
        var tool = item.tool;
        var status = item.status;
        var config = statusConfig[status] || statusConfig['not-installed'];
        var icon = typeIcons[tool.type] || typeIcons.extension;

        var statusHtml = config.label
            ? '<span class="tool-status ' + config.cssClass + '">' + escapeHtml(config.label) + '</span>'
            : '';

        var actionHtml = '';
        if (config.action && config.actionType) {
            var btnClass = config.actionType === 'open' ? 'action-button secondary' : 'action-button';
            actionHtml = '<div class="tool-actions">' +
                '<button class="' + btnClass + '" data-action="' + config.actionType + '" data-tool-id="' + escapeHtml(tool.id) + '">' +
                escapeHtml(config.action) +
                '</button></div>';
        }

        var progressHtml = (status === 'in-progress')
            ? '<div class="progress-bar"></div>'
            : '';

        return '<div class="tool-card" data-tool-id="' + escapeHtml(tool.id) + '">' +
            '<div class="tool-icon">' + icon + '</div>' +
            '<div class="tool-info">' +
                '<div class="tool-name">' + escapeHtml(tool.name) + '</div>' +
                '<div class="tool-description">' + escapeHtml(tool.description) + '</div>' +
                '<div class="tool-meta">' +
                    '<span class="tool-type-badge">' + escapeHtml(tool.type) + '</span>' +
                    '<span class="tool-category">' + escapeHtml(tool.category) + '</span>' +
                    '<span class="tool-version">v' + escapeHtml(tool.version) + '</span>' +
                    statusHtml +
                '</div>' +
                progressHtml +
            '</div>' +
            actionHtml +
        '</div>';
    }

    /**
     * @param {string} str
     * @returns {string}
     */
    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Event: search input
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            searchQuery = searchInput.value;
            render();
            vscode.postMessage({ type: 'search', query: searchQuery });
        });
    }

    // Event: section toggle (collapse/expand)
    document.addEventListener('click', function (e) {
        var header = /** @type {HTMLElement} */ (e.target).closest('.section-header');
        if (header) {
            var section = header.parentElement;
            if (section) {
                section.classList.toggle('collapsed');
            }
            return;
        }

        // Action button clicks
        var button = /** @type {HTMLElement} */ (e.target).closest('.action-button');
        if (button) {
            var action = button.getAttribute('data-action');
            var toolId = button.getAttribute('data-tool-id');
            if (action && toolId) {
                vscode.postMessage({ type: action, toolId: toolId });
            } else if (button.id === 'retry-button') {
                vscode.postMessage({ type: 'refresh' });
            }
            return;
        }
    });

    // Handle messages from the extension
    window.addEventListener('message', function (event) {
        var message = event.data;
        switch (message.type) {
            case 'updateCatalog':
                allTools = message.tools || [];
                render();
                break;

            case 'updateToolStatus':
                for (var i = 0; i < allTools.length; i++) {
                    if (allTools[i].tool.id === message.toolId) {
                        allTools[i].status = message.status;
                        break;
                    }
                }
                render();
                break;

            case 'operationProgress':
                // Could show per-tool progress message in the future
                break;

            case 'error':
                if (errorState && errorMessage) {
                    errorMessage.textContent = message.message;
                    errorState.style.display = '';
                }
                break;
        }
    });

    // Initial load: request refresh
    vscode.postMessage({ type: 'refresh' });
})();
