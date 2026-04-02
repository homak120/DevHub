# Data Model: AEP Dev Hub

**Branch**: `001-aep-devhub-mvp` | **Date**: 2026-04-01

## Entities

### Tool

The central entity representing an approved engineering resource
in the catalog.

| Field           | Type                                          | Required | Description                                       |
|-----------------|-----------------------------------------------|----------|---------------------------------------------------|
| id              | string                                        | yes      | Unique identifier (kebab-case)                    |
| name            | string                                        | yes      | Display name                                      |
| description     | string                                        | yes      | Short description shown in catalog                |
| category        | string                                        | yes      | Grouping category (e.g., "Extensions", "CLI")     |
| type            | "extension" \| "npm" \| "artifactory"         | yes      | Tool type determines install behavior             |
| version         | string                                        | yes      | Semantic version of the tool                      |
| registrySource  | ExtensionSource \| NpmSource \| ArtifactorySource | yes  | Type-specific source configuration                |
| deprecated      | boolean                                       | no       | If true, tool is no longer approved (default: false) |

**Validation rules**:
- `id` MUST be unique across the registry
- `version` MUST follow semver format
- `type` determines which `registrySource` variant is used

### ExtensionSource

Source configuration for VS Code extension tools.

| Field       | Type   | Required | Description                              |
|-------------|--------|----------|------------------------------------------|
| extensionId | string | yes      | VS Code extension identifier             |
| vsixPath    | string | yes      | Artifactory path to .vsix file           |

### NpmSource

Source configuration for npm package tools.

| Field          | Type                                  | Required | Description                          |
|----------------|---------------------------------------|----------|--------------------------------------|
| packageName    | string                                | yes      | npm package name                     |
| dependencyType | "dependencies" \| "devDependencies"   | yes      | Where to install in package.json     |

### ArtifactorySource

Source configuration for Artifactory artifact tools.

| Field          | Type   | Required | Description                            |
|----------------|--------|----------|----------------------------------------|
| repository     | string | yes      | Artifactory repository name            |
| artifactPath   | string | yes      | Path within repository                 |
| targetPath     | string | yes      | Relative workspace path for placement  |

### ToolRegistry

Top-level schema for the static JSON registry file.

| Field    | Type   | Required | Description                        |
|----------|--------|----------|------------------------------------|
| version  | string | yes      | Registry schema version            |
| tools    | Tool[] | yes      | Array of approved tool definitions |

**Validation rules**:
- `version` MUST follow semver format
- `tools` array MUST NOT be empty
- No duplicate `id` values across tools

### OperationRequest

Represents a queued tool operation.

| Field     | Type                                    | Required | Description                        |
|-----------|-----------------------------------------|----------|------------------------------------|
| toolId    | string                                  | yes      | ID of the tool being operated on   |
| action    | "install" \| "update" \| "pull"         | yes      | Operation type                     |
| timestamp | number                                  | yes      | Queue entry time (epoch ms)        |

### OperationResult

Result of a completed operation.

| Field     | Type                                    | Required | Description                        |
|-----------|-----------------------------------------|----------|------------------------------------|
| toolId    | string                                  | yes      | ID of the tool operated on         |
| action    | "install" \| "update" \| "pull"         | yes      | Operation type                     |
| success   | boolean                                 | yes      | Whether operation succeeded        |
| message   | string                                  | yes      | Human-readable result message      |
| timestamp | number                                  | yes      | Completion time (epoch ms)         |

### ToolStatus

Computed status for a tool in the catalog (not persisted).

| Value            | Description                                    |
|------------------|------------------------------------------------|
| "not-installed"  | Tool is not present locally                    |
| "installed"      | Tool is installed, version matches registry    |
| "update-available" | Tool is installed but newer version in registry |
| "queued"         | Operation pending in queue                     |
| "in-progress"    | Operation currently executing                  |
| "error"          | Last operation failed                          |
| "deprecated"     | Tool is marked as no longer approved           |

## Relationships

```text
ToolRegistry 1──* Tool
Tool 1──1 (ExtensionSource | NpmSource | ArtifactorySource)
Tool 1──0..* OperationRequest (via queue)
OperationRequest 1──1 OperationResult (after completion)
Tool ──computed── ToolStatus
```

## State Transitions

### Tool Status Lifecycle

```text
not-installed ──[install clicked]──→ queued
queued ──[dequeued for execution]──→ in-progress
in-progress ──[success]──→ installed
in-progress ──[failure]──→ error
installed ──[new version in registry]──→ update-available
update-available ──[update clicked]──→ queued
error ──[retry clicked]──→ queued
installed ──[tool.deprecated = true]──→ deprecated
not-installed ──[tool.deprecated = true]──→ deprecated
```
