# Research: AEP Dev Hub

**Branch**: `001-aep-devhub-mvp` | **Date**: 2026-04-01

## R1: VS Code TreeDataProvider for Tool Catalog

**Decision**: Use native `vscode.TreeDataProvider<ToolTreeItem>`
with `vscode.TreeItem` subclass for the sidebar catalog.

**Rationale**: TreeDataProvider is the idiomatic VS Code pattern
for sidebar lists. It supports icons, descriptions, inline
actions (via `view/item/context` menus), and built-in
accessibility. It is lightweight — no webview overhead, no
HTML/CSS to maintain. Aligns with Constitution Principle I
(Extension-First Architecture).

**Alternatives considered**:
- Webview sidebar: richer UI but heavier, violates extension-first
  principle, requires bundling CSS/HTML, accessibility burden.
- QuickPick: not suitable for persistent browsing, only modal
  selection.

## R2: VSIX Sideload Installation

**Decision**: Use `vscode.commands.executeCommand(
'workbench.extensions.installExtension', vsixUri)` to install
VSIX files downloaded from Artifactory.

**Rationale**: This is the officially supported VS Code API for
programmatic VSIX installation. The URI can point to a local
file after download. Avoids shelling out to `code --install-extension`.

**Alternatives considered**:
- `code` CLI with `--install-extension`: requires CLI on PATH,
  not guaranteed in all environments, shell calls violate
  constitution principle I.
- VS Code Marketplace API: extensions are internal/private, not
  on public marketplace.

## R3: npm Package Installation

**Decision**: Use Node.js `child_process.spawn` to run
`npm install <package>@<version> --save` or `--save-dev` based
on the registry entry's `dependencyType` field. Execute in the
active workspace root.

**Rationale**: npm CLI is the standard tool, assumed available
per spec assumptions. Using `spawn` (not `exec`) allows
streaming stdout/stderr for progress. The dependency type comes
from the registry, avoiding guesswork.

**Alternatives considered**:
- `npm` programmatic API (`libnpm`): undocumented, unstable,
  not recommended for external use.
- `yarn`/`pnpm`: not assumed available; npm is the baseline per
  constitution technology constraints.

## R4: Artifactory Artifact Download

**Decision**: Use Node.js `https` module (or `node-fetch` if
needed) to download artifacts from Artifactory REST API. Target
URL constructed from registry entry fields (repository, path,
version). Assumes pre-authenticated access via environment
tokens or `.netrc`.

**Rationale**: Minimal dependencies — `https` is built into
Node.js. Artifactory REST API is well-documented for artifact
retrieval. Auth is deferred per spec clarification; MVP reads
tokens from environment.

**Alternatives considered**:
- JFrog CLI: external dependency, not guaranteed installed.
- `axios`/`got`: unnecessary runtime dependency for simple
  HTTP GET; constitution constrains runtime deps.

## R5: Sequential Operation Queue

**Decision**: Implement a simple async FIFO queue class
(`OperationQueue`) that accepts `OperationRequest` objects and
processes them one at a time. Each operation reports progress
via `vscode.window.withProgress`.

**Rationale**: Sequential execution prevents race conditions on
shared resources (`package.json`, filesystem writes). A queue
class is simple to implement (~50 lines), test, and reason
about. Aligns with spec clarification (FIFO queue).

**Alternatives considered**:
- p-queue (npm): adds a runtime dependency for trivial
  functionality.
- Event-based pub/sub: overengineered for sequential processing.

## R6: Offline Registry Cache

**Decision**: On successful registry load, write a copy to
VS Code's `globalStorageUri` path. On next load, if the
bundled registry fails or network is unavailable, fall back to
the cached copy. Use `vscode.workspace.fs` for atomic
read/write.

**Rationale**: `globalStorageUri` is the VS Code-sanctioned
location for extension-managed persistent data. `workspace.fs`
provides cross-platform file operations. The cache is a
best-effort fallback, not a sync mechanism.

**Alternatives considered**:
- `ExtensionContext.globalState`: Memento API has size limits
  and is not designed for large JSON blobs.
- localStorage: not available in extension host context.

## R7: Testing Strategy

**Decision**: Use `@vscode/test-electron` for integration tests
that require the VS Code runtime, and Mocha + sinon for unit
tests that can run in pure Node.js.

**Rationale**: `@vscode/test-electron` is the official VS Code
extension testing framework. Mocha is the de facto standard for
Node.js/TypeScript projects. Sinon provides mocking/stubbing
for service isolation. This combination is well-documented and
widely used in the VS Code extension ecosystem.

**Alternatives considered**:
- Jest: configuration conflicts with VS Code extension test
  runner; less community support for extension testing.
- Vitest: newer, less proven in VS Code extension context.

## R8: Status Detection per Tool Type

**Decision**: Implement a `StatusDetector` service with
type-specific strategies:
- **Extension**: Query `vscode.extensions.all` for matching
  extension ID; compare versions.
- **npm package**: Check `node_modules/<package>/package.json`
  in active workspace; compare versions.
- **Artifactory artifact**: Check target file path existence
  in workspace.

**Rationale**: Each tool type has a different installation
footprint. A strategy pattern keeps detection logic isolated
and testable per type without a monolithic switch statement.

**Alternatives considered**:
- Single detection function with switch: harder to test, grows
  with new tool types.
- Persistent install database: overengineered for MVP; filesystem
  checks are sufficient and always current.
