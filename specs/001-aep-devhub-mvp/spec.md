# Feature Specification: AEP Dev Hub

**Feature Branch**: `001-aep-devhub-mvp`
**Created**: 2026-04-01
**Status**: Draft
**Input**: User description: "Build an internal VS Code extension called AEP Dev Hub that acts as a central hub for AEP engineering tools. MVP should support browsing a tool catalog, launching approved existing extensions, installing npm packages, and pulling approved artifacts from Artifactory. A later phase should support pulling files from Bitbucket and populating workspace files with conflict preview and manual fallback."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Tool Catalog (Priority: P1)

As an AEP engineer, I open the Dev Hub sidebar in VS Code and
see a marketplace-style catalog of all approved engineering
tools. Each tool is displayed as a card with an icon, name,
description, category, and current status (installed, available,
update available). Tools are grouped into "Installed" and
"Available" sections with count badges. I can search and filter
tools using a search bar at the top of the sidebar.

**Why this priority**: The catalog is the foundation of the
entire hub — without it, no other feature can be discovered or
launched. This is the minimum viable product on its own.

**Independent Test**: Open VS Code with the extension installed,
click the Dev Hub sidebar icon, and verify the marketplace-style
catalog renders with tool cards showing icons, descriptions,
and status indicators.

**Acceptance Scenarios**:

1. **Given** the extension is installed and activated, **When**
   I click the Dev Hub icon in the activity bar, **Then** the
   sidebar opens showing a marketplace-style catalog with tool
   cards displaying icon, name, description, category, and
   status for each approved tool.
2. **Given** the catalog is open, **When** I type in the search
   bar at the top, **Then** the tool list filters in real-time
   to show only tools matching by name, description, or category.
3. **Given** the catalog is open, **When** I view the sections,
   **Then** I see tools grouped into "Installed" (with count
   badge) and "Available" sections, each collapsible.
4. **Given** the catalog is open and no tools match my search,
   **When** I view the results, **Then** I see a clear
   "No tools found" message with a suggestion to clear filters.

---

### User Story 2 - Launch Existing Extensions (Priority: P1)

As an AEP engineer, I select an approved VS Code extension from
the catalog and launch (install/activate) it directly from Dev
Hub without leaving my workflow.

**Why this priority**: Launching existing extensions is one of
the two core MVP actions and delivers immediate value — engineers
no longer hunt through the marketplace for approved tools.

**Independent Test**: Browse the catalog, click "Launch" on an
extension-type tool, and verify the extension installs and
activates in VS Code.

**Acceptance Scenarios**:

1. **Given** I see an extension tool in the catalog that is not
   installed, **When** I click "Install", **Then** the extension
   is installed and I see a success notification with the option
   to activate it.
2. **Given** an extension tool is already installed, **When** I
   view it in the catalog, **Then** its status shows "Installed"
   and I see an "Open" or "Activate" action instead of "Install".
3. **Given** I initiate an extension install, **When** the
   installation is in progress, **Then** I see a progress
   indicator and cannot trigger a duplicate install.
4. **Given** an extension install fails, **When** I view the
   result, **Then** I see a clear error message describing what
   went wrong and a "Retry" option.

---

### User Story 3 - Install npm Packages (Priority: P2)

As an AEP engineer, I select an npm package tool from the
catalog and install it into my current workspace. Dev Hub
handles the npm install process and reports success or failure.

**Why this priority**: npm package installation is a common
developer action that Dev Hub can streamline by ensuring only
approved packages are offered. It depends on having the catalog
(US1) in place.

**Independent Test**: Browse the catalog, click "Install" on an
npm package tool, and verify the package appears in
`node_modules` and `package.json`.

**Acceptance Scenarios**:

1. **Given** I see an npm package tool in the catalog, **When**
   I click "Install", **Then** the package is installed into the
   active workspace and I see a success notification.
2. **Given** no workspace folder is open, **When** I attempt to
   install an npm package, **Then** I see an error message
   asking me to open a workspace first.
3. **Given** the package is already installed in the workspace,
   **When** I view it in the catalog, **Then** its status shows
   "Installed" with the current version and an "Update" action
   if a newer approved version exists.
4. **Given** an npm install fails (network error, permissions),
   **When** I view the result, **Then** I see a descriptive
   error message and a "Retry" option.

---

### User Story 4 - Pull Artifacts from Artifactory (Priority: P2)

As an AEP engineer, I select an Artifactory-hosted tool or
artifact from the catalog and pull it into my workspace. Dev Hub
handles the download and placement of the artifact using
pre-configured environment credentials.

**Why this priority**: Artifactory integration rounds out the
MVP by supporting non-npm artifacts (binaries, config files,
templates) that AEP teams rely on. Depends on the catalog (US1).

**Independent Test**: Browse the catalog, click "Pull" on an
Artifactory artifact, and verify the artifact is downloaded to
the expected workspace location.

**Acceptance Scenarios**:

1. **Given** I see an Artifactory artifact in the catalog,
   **When** I click "Pull", **Then** the artifact is downloaded
   and placed in the designated workspace location with a
   success notification.
2. **Given** my environment lacks valid Artifactory credentials,
   **When** I attempt to pull an artifact, **Then** I see a
   clear error message explaining that authentication is
   required and how to configure it externally.
3. **Given** an artifact download is in progress, **When** I
   view the catalog entry, **Then** I see a progress indicator
   showing download status.
4. **Given** the artifact already exists locally at the target
   path, **When** I pull it again, **Then** I am prompted to
   confirm overwrite or skip.

---

### User Story 5 - Pull Files from Bitbucket (Priority: P3)

As an AEP engineer, I select a Bitbucket-hosted resource from
the catalog and pull specific files or directories into my
workspace. Dev Hub previews any conflicts with existing files
and lets me resolve them manually before overwriting.

**Why this priority**: This is a Phase 1.5 feature that extends
the hub's reach to source-controlled templates and configs. It
builds on the foundation of US1-US4 and adds conflict handling
complexity.

**Independent Test**: Browse the catalog, click "Pull" on a
Bitbucket resource, and verify files are placed in the workspace
with conflict preview when existing files would be overwritten.

**Acceptance Scenarios**:

1. **Given** I see a Bitbucket resource in the catalog, **When**
   I click "Pull", **Then** the files are fetched and placed in
   the designated workspace location with a success notification.
2. **Given** pulled files conflict with existing workspace files,
   **When** the pull completes, **Then** I see a conflict preview
   showing a diff of each conflicting file with options to
   accept incoming, keep existing, or open a manual merge view.
3. **Given** I choose manual merge for a conflict, **When** the
   merge view opens, **Then** I see a side-by-side diff editor
   where I can resolve the conflict.
4. **Given** my environment lacks valid Bitbucket credentials,
   **When** I attempt to pull, **Then** I see a clear error
   message explaining that authentication is required and how
   to configure it externally.
5. **Given** I cancel a pull operation mid-flight, **When** the
   cancellation completes, **Then** no partial files are left
   in my workspace (atomic operation).

---

### Edge Cases

- What happens when the tool registry JSON is malformed or
  unreachable? The catalog MUST display a clear error state
  with a "Retry" action rather than an empty or broken view.
- What happens when multiple installs/pulls are triggered
  simultaneously? Operations MUST be processed in a sequential
  FIFO queue — one at a time. A queue indicator MUST show
  pending operations and their position.
- What happens when VS Code is offline? The catalog MUST show
  a cached version of the registry (if previously loaded) with
  a "Working Offline" indicator and disable network-dependent
  actions.
- What happens when a tool is removed from the approved
  registry? Previously installed tools remain functional but
  the catalog MUST indicate the tool is "Deprecated" or
  "No longer approved".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a browsable, searchable
  catalog of approved AEP engineering tools in a VS Code
  sidebar panel using a marketplace-style Webview with card
  layout, search bar, section grouping, and inline action
  buttons.
- **FR-002**: System MUST read tool definitions from a static
  JSON registry that includes name, description, category,
  type (extension/npm/artifactory), and version.
- **FR-003**: System MUST detect the current installation status
  of each tool (not installed, installed, update available) and
  display it in the catalog.
- **FR-004**: System MUST support installing approved VS Code
  extensions by downloading VSIX files from Artifactory and
  sideloading them locally.
- **FR-005**: System MUST support installing approved npm
  packages into the active workspace from the catalog, using
  the dependency type (dependencies or devDependencies)
  specified in the tool's registry entry.
- **FR-006**: System MUST support downloading approved artifacts
  from Artifactory into the workspace.
- **FR-007**: System MUST assume pre-authenticated access to
  Artifactory (e.g., existing environment tokens or .netrc).
  Credential management and prompting are deferred to a later
  phase.
- **FR-008**: System MUST show progress indicators for all
  long-running operations (install, download, pull).
- **FR-009**: System MUST display clear, actionable error
  messages when operations fail, with retry options.
- **FR-010**: System MUST support pulling files from Bitbucket
  repositories into the workspace (Phase 1.5).
- **FR-011**: System MUST preview file conflicts when pulled
  files would overwrite existing workspace files, offering
  accept, keep, or manual merge options (Phase 1.5).
- **FR-012**: System MUST ensure atomic file operations — no
  partial files left on cancellation or failure.
- **FR-013**: System MUST support offline mode by caching the
  last-known registry state and disabling network actions.

### Key Entities

- **Tool**: An approved engineering resource in the catalog.
  Attributes: name, description, category, type, version,
  registry source, installation status, dependency type
  (for npm tools: dependencies or devDependencies).
- **Tool Registry**: The static JSON data source that defines
  all approved tools and their metadata.
- **Artifact**: A downloadable file or package hosted on
  Artifactory. Attributes: repository path, version, target
  workspace location.
- **Bitbucket Resource**: A file or directory in a Bitbucket
  repository. Attributes: repo, branch/ref, file path(s),
  target workspace location.
- **Conflict**: A detected difference between a pulled file and
  an existing workspace file. Attributes: file path, incoming
  content, existing content, resolution status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Engineers can discover and view all approved tools
  within 5 seconds of opening the Dev Hub sidebar.
- **SC-002**: Engineers can install an approved VS Code extension
  from the catalog in under 30 seconds (excluding download
  time).
- **SC-003**: Engineers can install an approved npm package from
  the catalog in under 30 seconds (excluding download time).
- **SC-004**: Engineers can pull an Artifactory artifact from the
  catalog in under 30 seconds (excluding download time).
- **SC-005**: 100% of tool operations provide visible progress
  feedback within 1 second of initiation.
- **SC-006**: 100% of failed operations display an actionable
  error message with a retry option.
- **SC-007**: Engineers can resolve file conflicts from Bitbucket
  pulls using the built-in conflict preview without leaving
  VS Code (Phase 1.5).
- **SC-008**: The tool catalog loads from cache within 2 seconds
  when offline.

## Clarifications

### Session 2026-04-01

- Q: What UI approach for the catalog sidebar? → A: Marketplace-style Webview sidebar using VS Code WebviewViewProvider with HTML/CSS card layout, search bar, and section grouping. (Updated 2026-04-03: originally TreeDataProvider, changed to WebviewViewProvider for richer multi-line card UI matching the VS Code Extensions panel look.)
- Q: Why switch from TreeView to Webview? → A: TreeDataProvider only supports single-line items. Marketplace-style cards with multi-line content (name, description, publisher/category) and inline action buttons require a WebviewViewProvider with custom HTML/CSS. The VS Code Extensions panel itself uses this approach.
- Q: Where are approved extensions sourced from? → A: VSIX sideload from Artifactory — download .vsix files and install locally.
- Q: How are Artifactory/Bitbucket credentials stored? → A: Not handled in MVP. Authentication is deferred to Phase 1.5 or later. MVP assumes pre-authenticated access (e.g., existing environment tokens).
- Q: npm install scope (dependencies vs devDependencies)? → A: Registry-defined per tool — each tool entry specifies its dependency type.
- Q: How are concurrent operations handled? → A: Sequential queue — one operation at a time in FIFO order with a queue indicator.

## Assumptions

- Engineers have VS Code installed and use it as their primary
  IDE.
- The approved tool list is maintained as a static JSON file
  bundled with the extension (not fetched from a remote server
  at runtime). Updates to the registry ship with extension
  updates.
- Engineers have network access to Artifactory and Bitbucket
  from their development environment (when not offline).
- Authentication for Artifactory and Bitbucket is out of scope
  for MVP. The system assumes pre-authenticated access via
  existing environment tokens or host-level configuration.
  Credential prompting and secure storage are deferred.
- npm is available on the engineer's system PATH for package
  installation.
- The initial set of supported tools includes: AEP UI Copilot
  Extension, FarmFix CLI, AEP MCP Connector, and SmartADA.
- Phase 1 (US1-US4) and Phase 1.5 (US5) are separate release
  milestones — Phase 1.5 features are not required for the
  initial MVP release.
- Mobile support is out of scope — this is a desktop VS Code
  extension only.
