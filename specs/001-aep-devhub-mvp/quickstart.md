# Quickstart: AEP Dev Hub

**Branch**: `001-aep-devhub-mvp` | **Date**: 2026-04-01

## Prerequisites

- VS Code 1.110+ installed
- Node.js 18+ and npm available on PATH
- Network access to Artifactory (for extension/artifact pulls)
- Artifactory credentials configured in environment
  (e.g., `ARTIFACTORY_TOKEN` env var or `.netrc`)

## Setup

```bash
# Clone and install dependencies
git clone <repo-url> && cd DevHub
npm install

# Compile TypeScript
npm run compile

# Run tests (TDD — run before and after changes)
npm test
```

## Development Workflow

```bash
# 1. Open in VS Code
code .

# 2. Press F5 to launch Extension Development Host
#    → Dev Hub icon appears in activity bar
#    → Click to open tool catalog sidebar

# 3. Make changes following TDD cycle:
#    a. Write/update test in tests/
#    b. Verify test fails (red)
#    c. Implement in src/
#    d. Verify test passes (green)
#    e. Refactor if needed

# 4. Run full test suite
npm test
```

## Key Files

| Purpose              | Path                              |
|----------------------|-----------------------------------|
| Extension entry      | `src/extension.ts`                |
| Tool types           | `src/types/tool.ts`               |
| Registry types       | `src/types/registry.ts`           |
| Message protocol     | `src/types/messages.ts`           |
| Catalog webview      | `src/webview/catalogViewProvider.ts` |
| HTML template        | `src/webview/getWebviewContent.ts` |
| Webview CSS          | `resources/webview/catalog.css`   |
| Webview JS           | `resources/webview/catalog.js`    |
| Registry service     | `src/services/registryService.ts` |
| Operation queue      | `src/services/operationQueue.ts`  |
| Tool registry data   | `data/tool-registry.json`         |
| Unit tests           | `tests/unit/`                     |
| Integration tests    | `tests/integration/`              |

## Verify It Works

1. Press F5 in VS Code to launch Extension Development Host
2. Click the "AEP Dev Hub" icon in the activity bar
3. Verify the marketplace-style catalog loads with tool cards
   showing icons, names, descriptions, categories, and status
4. Verify tools are grouped into "INSTALLED" and "AVAILABLE"
   sections with count badges
5. Type in the search bar — verify tools filter in real-time
   by name, description, or category
6. Click "Install" on any tool card — verify progress indicator
   appears and operation completes (or shows auth error if
   Artifactory not configured)
7. Trigger a second install while the first is running — verify
   it queues instead of running concurrently

## Common Tasks

### Add a new tool to the registry

Edit `data/tool-registry.json` and add a new entry following the
schema in `contracts/extension-api.md`. The TypeScript compiler
will validate the entry against the `Tool` type.

### Run only unit tests

```bash
npm run test:unit
```

### Run only integration tests

```bash
npm run test:integration
```

### Package as VSIX

```bash
npx vsce package
```
