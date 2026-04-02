# Extension API Contract: AEP Dev Hub

**Branch**: `001-aep-devhub-mvp` | **Date**: 2026-04-01

## Contribution Points (package.json)

### Views

```jsonc
{
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "aepDevHub",
          "title": "AEP Dev Hub",
          "icon": "resources/devhub-icon.svg"
        }
      ]
    },
    "views": {
      "aepDevHub": [
        {
          "id": "aepDevHub.toolCatalog",
          "name": "Tool Catalog"
        }
      ]
    }
  }
}
```

### Commands

| Command ID                          | Title                    | Icon     | Context               |
|-------------------------------------|--------------------------|----------|-----------------------|
| `aepDevHub.refreshCatalog`          | Refresh Tool Catalog     | refresh  | view/title            |
| `aepDevHub.installTool`             | Install Tool             | download | view/item/context     |
| `aepDevHub.updateTool`              | Update Tool              | sync     | view/item/context     |
| `aepDevHub.retryOperation`          | Retry                    | debug-restart | view/item/context |
| `aepDevHub.openTool`                | Open/Activate            | go-to-file | view/item/context  |

### Activation Events

```jsonc
{
  "activationEvents": [
    "onView:aepDevHub.toolCatalog"
  ]
}
```

## TreeDataProvider Contract

### ToolCatalogProvider

```typescript
interface ToolCatalogProvider extends vscode.TreeDataProvider<ToolTreeItem> {
  getTreeItem(element: ToolTreeItem): vscode.TreeItem;
  getChildren(element?: ToolTreeItem): ToolTreeItem[];
  refresh(): void;
}
```

### ToolTreeItem

```typescript
// TreeItem displayed in the catalog sidebar
// - Category nodes: collapsible group headers
// - Tool nodes: leaf items with status icon and inline actions
//
// contextValue determines which commands appear:
//   "tool-not-installed"  → Install action
//   "tool-installed"      → Open/Activate action
//   "tool-update"         → Update action
//   "tool-queued"         → no actions (pending)
//   "tool-in-progress"    → no actions (busy)
//   "tool-error"          → Retry action
```

## Service Contracts

### RegistryService

```typescript
interface RegistryService {
  // Load registry from bundled JSON, falling back to cache
  loadRegistry(): Promise<ToolRegistry>;
  // Get cached registry (synchronous, may be stale)
  getCachedRegistry(): ToolRegistry | undefined;
  // Persist current registry to global storage for offline use
  cacheRegistry(registry: ToolRegistry): Promise<void>;
}
```

### StatusDetector

```typescript
interface StatusDetector {
  // Determine installation status for a single tool
  detectStatus(tool: Tool): Promise<ToolStatus>;
  // Batch status detection for all tools
  detectAllStatuses(tools: Tool[]): Promise<Map<string, ToolStatus>>;
}
```

### OperationQueue

```typescript
interface OperationQueue {
  // Enqueue an operation; returns position in queue
  enqueue(request: OperationRequest): number;
  // Current queue length
  readonly length: number;
  // Currently executing operation (if any)
  readonly current: OperationRequest | undefined;
  // Event fired when queue state changes
  readonly onDidChange: vscode.Event<void>;
}
```

### Tool Installers

```typescript
interface ToolInstaller {
  // Execute installation for a tool
  install(tool: Tool, progress: vscode.Progress<{
    message?: string;
    increment?: number;
  }>): Promise<OperationResult>;
  // Check if this installer handles the given tool type
  canHandle(tool: Tool): boolean;
}
```

Three implementations:
- `ExtensionInstaller`: downloads VSIX from Artifactory, calls
  `workbench.extensions.installExtension`
- `NpmInstaller`: spawns `npm install` with correct flags
- `ArtifactoryPuller`: downloads artifact to target workspace path

## Registry JSON Schema

```jsonc
{
  "version": "1.0.0",
  "tools": [
    {
      "id": "aep-ui-copilot",
      "name": "AEP UI Copilot Extension",
      "description": "AI-powered UI development assistant for AEP",
      "category": "Extensions",
      "type": "extension",
      "version": "1.2.0",
      "registrySource": {
        "extensionId": "aep.ui-copilot",
        "vsixPath": "aep-extensions/ui-copilot/1.2.0/aep-ui-copilot-1.2.0.vsix"
      }
    },
    {
      "id": "farmfix-cli",
      "name": "FarmFix CLI",
      "description": "CLI tool for farm infrastructure management",
      "category": "CLI Tools",
      "type": "npm",
      "version": "3.1.0",
      "registrySource": {
        "packageName": "@aep/farmfix-cli",
        "dependencyType": "devDependencies"
      }
    },
    {
      "id": "aep-mcp-connector",
      "name": "AEP MCP Connector",
      "description": "Model Context Protocol connector for AEP services",
      "category": "Extensions",
      "type": "extension",
      "version": "0.9.1",
      "registrySource": {
        "extensionId": "aep.mcp-connector",
        "vsixPath": "aep-extensions/mcp-connector/0.9.1/aep-mcp-connector-0.9.1.vsix"
      }
    },
    {
      "id": "smartada",
      "name": "SmartADA",
      "description": "Accessibility compliance analysis tool",
      "category": "Quality",
      "type": "artifactory",
      "version": "2.0.0",
      "registrySource": {
        "repository": "aep-tools-release",
        "artifactPath": "smartada/2.0.0/smartada-bundle.zip",
        "targetPath": ".smartada"
      }
    }
  ]
}
```
