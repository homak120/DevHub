# Implementation Plan: AEP Dev Hub

**Branch**: `001-aep-devhub-mvp` | **Date**: 2026-04-01 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-aep-devhub-mvp/spec.md`

## Summary

Build an internal VS Code extension that provides a centralized
tool catalog for AEP engineering teams. The extension renders a
marketplace-style Webview sidebar listing approved tools
(extensions, npm packages, Artifactory artifacts) from a static
JSON registry. Each tool is displayed as a card with icon, name,
description, and category — similar to the VS Code Extensions
panel.
Engineers can install extensions via VSIX sideload, install npm
packages with registry-defined dependency types, and pull
Artifactory artifacts — all through a sequential operation queue
with progress feedback. Phase 1.5 adds Bitbucket file pulling
with conflict preview.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: `@types/vscode` (VS Code Extension API)
**Storage**: Static JSON registry bundled with extension; local
filesystem cache for offline mode
**Testing**: VS Code Extension Test framework (`@vscode/test-electron`),
Mocha for unit tests
**Target Platform**: VS Code desktop (all OS)
**Project Type**: VS Code extension (VSIX distribution)
**Performance Goals**: Catalog render <5s, operation initiation
feedback <1s, cached catalog load <2s
**Constraints**: No runtime framework dependencies beyond
`@types/vscode`; offline-capable via registry cache; no auth
management in MVP
**Scale/Scope**: ~4 initial tools, single-user desktop extension

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Extension-First Architecture — PASS

- Sidebar catalog uses WebviewViewProvider registered via
  `window.registerWebviewViewProvider` (contribution-point model)
- All tool operations go through a service layer (ExtensionInstaller,
  NpmInstaller, ArtifactoryPuller)
- Activation scoped to `onView:aepDevHub.toolCatalog`
- All registrations return Disposables via `context.subscriptions`
- Webview uses `localResourceRoots` and CSP for security

### II. Type Safety — PASS

- `strict: true` enforced in tsconfig.json
- Registry JSON backed by TypeScript interfaces (`Tool`,
  `ToolRegistry`, `Artifact`)
- External data (Artifactory responses) validated at boundary
  with type guards
- Shared types in `src/types/`

### III. Test-First (TDD) — PASS

- Unit tests for: registry parsing, status detection, operation
  queue logic, type validators
- Integration tests for: CatalogViewProvider (webview) rendering,
  extension install flow, npm install flow, Artifactory download flow
- TDD cycle enforced: tests written before implementation

**Gate result: ALL PASS — proceed to Phase 0.**

## Project Structure

### Documentation (this feature)

```text
specs/001-aep-devhub-mvp/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── types/
│   ├── tool.ts              # Tool, ToolEntry, ToolType interfaces
│   ├── registry.ts          # ToolRegistry schema type
│   ├── operations.ts        # OperationRequest, OperationResult types
│   └── messages.ts          # Webview ↔ extension message protocol
├── webview/
│   ├── catalogViewProvider.ts   # WebviewViewProvider for sidebar
│   └── getWebviewContent.ts     # HTML template generator
├── services/
│   ├── registryService.ts      # Load/parse/cache registry JSON
│   ├── statusDetector.ts       # Detect install status per tool type
│   ├── extensionInstaller.ts   # VSIX download + sideload
│   ├── npmInstaller.ts         # npm install with dep type
│   ├── artifactoryPuller.ts    # Artifactory artifact download
│   └── operationQueue.ts       # Sequential FIFO operation queue
├── utils/
│   ├── typeGuards.ts           # Runtime type validation for external data
│   └── cache.ts                # Offline registry cache helpers
├── extension.ts                # activate/deactivate entry point
└── constants.ts                # Command IDs, view IDs, config keys

data/
└── tool-registry.json          # Static bundled registry

resources/
├── devhub-icon.svg             # Activity bar icon
├── icons/
│   ├── extension.svg           # Tool type icon: extension
│   ├── npm.svg                 # Tool type icon: npm package
│   └── artifactory.svg        # Tool type icon: artifact
└── webview/
    ├── catalog.css             # Marketplace styles (VS Code theme vars)
    └── catalog.js              # Frontend script (plain JS)

tests/
├── unit/
│   ├── registryService.test.ts
│   ├── statusDetector.test.ts
│   ├── operationQueue.test.ts
│   ├── typeGuards.test.ts
│   └── cache.test.ts
├── integration/
│   ├── catalogViewProvider.test.ts
│   ├── extensionInstaller.test.ts
│   ├── npmInstaller.test.ts
│   └── artifactoryPuller.test.ts
└── fixtures/
    ├── valid-registry.json
    ├── malformed-registry.json
    └── mock-artifacts/
```

**Structure Decision**: Single-project VS Code extension layout.
`src/` contains all source code organized by role (types,
providers, services, utils). `data/` holds the static registry.
`tests/` mirrors src with unit and integration separation.

## Complexity Tracking

> No constitution violations detected — no justifications needed.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Plain JS in webview (not strict TS) | WebviewViewProvider requires browser JS for frontend rendering | TreeDataProvider cannot render multi-line card layouts; webview JS is minimal (~150 lines) and communicates via typed message protocol |
