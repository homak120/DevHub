# Tasks: AEP Dev Hub

**Input**: Design documents from `/specs/001-aep-devhub-mvp/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: TDD is mandated by the project constitution (Principle III — NON-NEGOTIABLE). Test tasks are included in every phase and MUST be written and fail before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Types in `src/types/`, providers in `src/providers/`, services in `src/services/`, utils in `src/utils/`
- Static data in `data/`

---

## Phase 1: Setup

**Purpose**: Project initialization and scaffolding

- [ ] T001 Initialize VS Code extension project with `package.json` including name, version, engine, activationEvents (`onView:aepDevHub.toolCatalog`), and contributes (viewsContainers, views, commands) per `contracts/extension-api.md`
- [ ] T002 Configure `tsconfig.json` with `strict: true`, `outDir: out`, `rootDir: src`, targeting ES2020 module system
- [ ] T003 [P] Install dev dependencies: `@types/vscode`, `typescript`, `@vscode/test-electron`, `mocha`, `@types/mocha`, `sinon`, `@types/sinon`
- [ ] T004 [P] Configure `.vscodeignore`, `.eslintrc.json` (include `@typescript-eslint/no-explicit-any: error` per constitution Principle II), and npm scripts (`compile`, `watch`, `test`, `test:unit`, `test:integration`, `package`)
- [ ] T005 [P] Create directory structure: `src/types/`, `src/providers/`, `src/services/`, `src/utils/`, `data/`, `tests/unit/`, `tests/integration/`, `tests/fixtures/`, `resources/`
- [ ] T006 [P] Create placeholder SVG icon at `resources/devhub-icon.svg` for activity bar

**Checkpoint**: Project compiles with `npm run compile` and empty test suite runs with `npm test`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, constants, and infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests for Foundational Phase ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T007 [P] Unit test for type guards: validate Tool, ToolRegistry, ExtensionSource, NpmSource, ArtifactorySource type checking in `tests/unit/typeGuards.test.ts`
- [ ] T008 [P] Unit test for operation queue: enqueue, FIFO ordering, sequential execution, length tracking, current operation, onDidChange event in `tests/unit/operationQueue.test.ts`

### Implementation for Foundational Phase

- [ ] T009 [P] Define Tool, ToolType, ExtensionSource, NpmSource, ArtifactorySource interfaces in `src/types/tool.ts` per data-model.md
- [ ] T010 [P] Define ToolRegistry interface in `src/types/registry.ts` per data-model.md
- [ ] T011 [P] Define OperationRequest, OperationResult, ToolStatus types in `src/types/operations.ts` per data-model.md
- [ ] T012 [P] Define command IDs, view IDs, and config keys in `src/constants.ts` per contracts/extension-api.md
- [ ] T013 Implement runtime type guards for Tool, ToolRegistry, and source variants in `src/utils/typeGuards.ts` — validate external JSON against typed interfaces using `unknown` input
- [ ] T014 Implement OperationQueue class in `src/services/operationQueue.ts` — async FIFO queue with `enqueue()`, `length`, `current`, `onDidChange` event emitter, sequential execution via `vscode.window.withProgress`
- [ ] T015 Create stub `src/extension.ts` with `activate(context)` and `deactivate()` exports — register disposables to `context.subscriptions`

**Checkpoint**: Foundation ready — `npm run compile` succeeds, T007-T008 tests pass. User story implementation can now begin.

---

## Phase 3: User Story 1 — Browse Tool Catalog (Priority: P1) 🎯 MVP

**Goal**: Engineers open the Dev Hub sidebar and see a categorized, searchable catalog of all approved tools with status indicators.

**Independent Test**: Open Extension Development Host (F5), click AEP Dev Hub activity bar icon, verify categorized tool list renders from `data/tool-registry.json` with correct names, descriptions, and status icons.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T016 [P] [US1] Unit test for RegistryService: load from bundled JSON, fallback to cache on failure, validate parsed output in `tests/unit/registryService.test.ts`
- [ ] T017 [P] [US1] Unit test for cache helpers: write registry to globalStorageUri, read back, handle missing cache in `tests/unit/cache.test.ts`
- [ ] T018 [P] [US1] Unit test for StatusDetector: detect extension status via `vscode.extensions.all`, npm status via `node_modules` check, artifactory status via file existence in `tests/unit/statusDetector.test.ts`
- [ ] T019 [P] [US1] Integration test for ToolCatalogProvider: getChildren returns category nodes at root, tool nodes under categories, correct contextValue per status in `tests/integration/toolCatalogProvider.test.ts`

### Implementation for User Story 1

- [ ] T020 [P] [US1] Create test fixture `tests/fixtures/valid-registry.json` with 4 tool entries matching contracts/extension-api.md registry schema
- [ ] T021 [P] [US1] Create test fixture `tests/fixtures/malformed-registry.json` with invalid JSON and missing required fields
- [ ] T022 [US1] Implement cache helpers in `src/utils/cache.ts` — `writeCache(uri, registry)` and `readCache(uri)` using `vscode.workspace.fs`
- [ ] T023 [US1] Implement RegistryService in `src/services/registryService.ts` — `loadRegistry()` reads bundled `data/tool-registry.json`, validates with type guards, caches to globalStorageUri; `getCachedRegistry()` returns in-memory copy; falls back to cache on error
- [ ] T024 [US1] Implement StatusDetector in `src/services/statusDetector.ts` — `detectStatus(tool)` with type-specific strategies: extension checks `vscode.extensions.all`, npm checks workspace `node_modules`, artifactory checks target file path; `detectAllStatuses(tools)` batch version
- [ ] T025 [US1] Implement ToolTreeItem in `src/providers/toolTreeItem.ts` — extends `vscode.TreeItem`, sets `contextValue` based on ToolStatus, icon based on tool type and status, description shows version and status text
- [ ] T026 [US1] Implement ToolCatalogProvider in `src/providers/toolCatalogProvider.ts` — `TreeDataProvider<ToolTreeItem>` with `getChildren()` returning category groups at root level and tool items under each category; `refresh()` reloads registry and statuses; fire `onDidChangeTreeData` on refresh
- [ ] T027 [US1] Create static tool registry at `data/tool-registry.json` with 4 initial tools (AEP UI Copilot, FarmFix CLI, AEP MCP Connector, SmartADA) per contracts/extension-api.md schema
- [ ] T028 [US1] Wire ToolCatalogProvider into `src/extension.ts` — register TreeDataProvider for view ID `aepDevHub.toolCatalog`, register `aepDevHub.refreshCatalog` command, push all disposables to `context.subscriptions`

**Checkpoint**: User Story 1 fully functional — F5 launches extension, sidebar shows categorized tools with status icons. Search/filter via VS Code's built-in tree view filter (Ctrl+F in tree).

---

## Phase 4: User Story 2 — Launch Existing Extensions (Priority: P1)

**Goal**: Engineers can install approved VS Code extensions by downloading VSIX from Artifactory and sideloading locally.

**Independent Test**: Click "Install" on an extension-type tool in the catalog, verify VSIX downloads from Artifactory, extension installs, status updates to "Installed", and success notification appears.

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T029 [P] [US2] Integration test for ExtensionInstaller: mock Artifactory HTTP response, verify VSIX download to temp path, verify `workbench.extensions.installExtension` command called with correct URI, verify OperationResult on success and failure in `tests/integration/extensionInstaller.test.ts`

### Implementation for User Story 2

- [ ] T030 [US2] Implement ExtensionInstaller in `src/services/extensionInstaller.ts` — `canHandle(tool)` returns true for type "extension"; `install(tool, progress, token)` downloads VSIX from Artifactory using `https` module (URL from `registrySource.vsixPath`), saves to temp file, calls `vscode.commands.executeCommand('workbench.extensions.installExtension', vsixUri)`, returns OperationResult; respects CancellationToken — aborts download and cleans up temp file on cancellation
- [ ] T031 [US2] Wire install command in `src/extension.ts` — register `aepDevHub.installTool` command that creates OperationRequest, enqueues to OperationQueue, routes to ExtensionInstaller based on tool type, refreshes catalog on completion, shows success/error notification

**Checkpoint**: User Story 2 functional — extension tools can be installed from catalog. Combined with US1, this is a demonstrable MVP.

---

## Phase 5: User Story 3 — Install npm Packages (Priority: P2)

**Goal**: Engineers can install approved npm packages into the active workspace with the correct dependency type from the registry.

**Independent Test**: Click "Install" on an npm-type tool, verify `npm install <package>@<version> --save-dev` (or `--save`) runs in workspace root, package appears in `package.json`, status updates to "Installed".

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T032 [P] [US3] Integration test for NpmInstaller: mock `child_process.spawn`, verify correct npm command args for dependencies vs devDependencies, verify workspace root as cwd, verify progress streaming from stdout, verify OperationResult on success/failure/no-workspace in `tests/integration/npmInstaller.test.ts`

### Implementation for User Story 3

- [ ] T033 [US3] Implement NpmInstaller in `src/services/npmInstaller.ts` — `canHandle(tool)` returns true for type "npm"; `install(tool, progress, token)` checks for active workspace folder (error if none), spawns `npm install <packageName>@<version>` with `--save` or `--save-dev` based on `registrySource.dependencyType`, streams stdout to progress, returns OperationResult; respects CancellationToken — kills spawned npm process on cancellation
- [ ] T034 [US3] Register NpmInstaller in `src/extension.ts` — add to installer routing in `aepDevHub.installTool` command handler so npm-type tools route to NpmInstaller

**Checkpoint**: User Story 3 functional — npm tools install with correct dependency type. Works independently alongside US1 catalog.

---

## Phase 6: User Story 4 — Pull Artifacts from Artifactory (Priority: P2)

**Goal**: Engineers can download approved Artifactory artifacts and place them at the designated workspace path.

**Independent Test**: Click "Pull" on an Artifactory-type tool, verify artifact downloads from Artifactory REST API, file placed at `registrySource.targetPath` in workspace, overwrite prompt shown if file exists, status updates.

### Tests for User Story 4 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T035 [P] [US4] Integration test for ArtifactoryPuller: mock HTTP response, verify download to correct workspace target path, verify overwrite prompt when target exists, verify atomic write (no partial files on failure), verify OperationResult in `tests/integration/artifactoryPuller.test.ts`

### Implementation for User Story 4

- [ ] T036 [US4] Implement ArtifactoryPuller in `src/services/artifactoryPuller.ts` — `canHandle(tool)` returns true for type "artifactory"; `install(tool, progress, token)` constructs Artifactory REST URL from `registrySource.repository` and `artifactPath`, downloads via `https` with progress reporting, checks if target exists (prompts overwrite via `vscode.window.showWarningMessage`), writes to `registrySource.targetPath` relative to workspace root atomically (write to temp then rename), returns OperationResult; respects CancellationToken — aborts download and removes temp file on cancellation
- [ ] T037 [US4] Create `tests/fixtures/mock-artifacts/` directory with a small test artifact file for integration test fixtures
- [ ] T038 [US4] Register ArtifactoryPuller in `src/extension.ts` — add to installer routing in `aepDevHub.installTool` command handler so artifactory-type tools route to ArtifactoryPuller

**Checkpoint**: User Story 4 functional — Artifactory artifacts download and place correctly. All Phase 1 stories (US1-US4) now complete.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T039 [P] Add offline mode handling in `src/services/registryService.ts` — detect network unavailability, load from cache, set offline flag; update ToolCatalogProvider to show "Working Offline" indicator and disable network-dependent actions
- [ ] T040 [P] Add error state handling in `src/providers/toolCatalogProvider.ts` — display error tree item with "Retry" action when registry load fails (malformed JSON, missing file)
- [ ] T041 [P] Register `aepDevHub.retryOperation` and `aepDevHub.openTool` commands in `src/extension.ts` — retry re-enqueues failed operation, open activates installed extension or opens artifact path
- [ ] T042 [P] Add `aepDevHub.updateTool` command in `src/extension.ts` — detect update-available status, re-run install with newer version
- [ ] T042b [P] Handle deprecated tools in `src/providers/toolCatalogProvider.ts` — check `tool.deprecated` flag, set contextValue to "tool-deprecated", show warning icon and "(Deprecated)" suffix in description, hide install/update actions
- [ ] T043 Run `quickstart.md` validation — follow all steps in Extension Development Host, verify 4 tools render, install/pull operations work, queue indicator appears for concurrent triggers
- [ ] T044 Run full test suite (`npm test`) and verify zero failures, then package extension with `npx vsce package` to produce VSIX

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (Phase 3) MUST complete before US2/US3/US4 (catalog required for all operations)
  - US2, US3, US4 (Phases 4-6) can proceed in parallel after US1 completes (they share the OperationQueue and install command but work on different files)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories — provides the catalog foundation
- **User Story 2 (P1)**: Depends on US1 completion (needs catalog + install command wiring) — independent of US3, US4
- **User Story 3 (P2)**: Depends on US1 completion (needs catalog) and T031 (install command routing infrastructure) — independent of US4
- **User Story 4 (P2)**: Depends on US1 completion (needs catalog) and T031 (install command routing infrastructure) — independent of US3

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Type definitions before services
- Services before providers
- Providers before extension wiring
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003-T006)
- Foundational tests T007-T008 can run in parallel
- Foundational type definitions T009-T012 can run in parallel
- US1 tests T016-T019 can run in parallel
- US1 fixtures T020-T021 can run in parallel
- After US1 completes: US2 test T029, US3 test T032, US4 test T035 can run in parallel
- Polish tasks T039-T042 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for US1 together:
Task: "Unit test for RegistryService in tests/unit/registryService.test.ts"
Task: "Unit test for cache helpers in tests/unit/cache.test.ts"
Task: "Unit test for StatusDetector in tests/unit/statusDetector.test.ts"
Task: "Integration test for ToolCatalogProvider in tests/integration/toolCatalogProvider.test.ts"

# Launch all fixtures together:
Task: "Create valid-registry.json in tests/fixtures/"
Task: "Create malformed-registry.json in tests/fixtures/"

# Sequential implementation (dependencies):
cache.ts → registryService.ts → statusDetector.ts → toolTreeItem.ts → toolCatalogProvider.ts → extension.ts wiring
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Browse Catalog)
4. Complete Phase 4: User Story 2 (Launch Extensions)
5. **STOP and VALIDATE**: Test catalog + extension install in Extension Development Host
6. Deploy/demo if ready — this is the core MVP

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Demo (catalog browsing)
3. Add User Story 2 → Test independently → Demo (MVP: catalog + extension install!)
4. Add User Story 3 → Test independently → Demo (+ npm packages)
5. Add User Story 4 → Test independently → Demo (+ Artifactory artifacts)
6. Polish phase → Final validation → Package VSIX

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. One developer: User Story 1 (required first)
3. Once US1 complete:
   - Developer A: User Story 2 (extensions)
   - Developer B: User Story 3 (npm)
   - Developer C: User Story 4 (Artifactory)
4. Stories integrate independently via shared OperationQueue

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable after US1 foundation
- TDD is NON-NEGOTIABLE per constitution — tests MUST fail before implementation
- Commit after each task or logical group using conventional commits
- Stop at any checkpoint to validate story independently
- US5 (Bitbucket/conflict preview) is Phase 1.5 — NOT included in this task list
