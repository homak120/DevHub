<!--
Sync Impact Report
==================
- Version change: 0.0.0 → 1.0.0 (MAJOR — initial ratification)
- Added principles:
  - I. Extension-First Architecture
  - II. Type Safety
  - III. Test-First (TDD)
- Added sections:
  - Technology Constraints
  - Development Workflow
  - Governance
- Removed sections: none (initial version)
- Templates requiring updates:
  - .specify/templates/plan-template.md — ✅ no updates needed (Constitution Check is dynamic)
  - .specify/templates/spec-template.md — ✅ no updates needed (generic structure)
  - .specify/templates/tasks-template.md — ✅ no updates needed (generic structure)
- Follow-up TODOs: none
-->

# AEP Dev Hub Constitution

## Core Principles

### I. Extension-First Architecture

All functionality MUST be built as proper VS Code extension
components following the VS Code Extension API contract:

- Every feature MUST manage its lifecycle through the
  `activate`/`deactivate` extension hooks.
- All registrations (commands, views, providers) MUST return
  `Disposable` objects pushed to `context.subscriptions`.
- Activation events MUST be scoped to the narrowest trigger
  (e.g., `onView:`, `onCommand:`) — never use `*`.
- Sidebar views, tree data providers, and webview panels MUST
  follow the VS Code contribution-point model defined in
  `package.json`.
- External tool launches (extensions, CLI, Artifactory pulls)
  MUST go through a well-defined service layer — no ad-hoc
  shell calls from UI code.

**Rationale**: AEP Dev Hub is a VS Code extension at its core.
Violating extension API patterns leads to memory leaks,
activation failures, and poor user experience.

### II. Type Safety

All code MUST be written in strict TypeScript with no escape
hatches:

- `strict: true` MUST be enabled in `tsconfig.json` — this is
  non-negotiable.
- The `any` type MUST NOT appear in source code. Use `unknown`
  with type guards or explicit interfaces instead.
- Tool registry entries MUST be backed by generated or
  hand-written TypeScript types — no untyped JSON access.
- External data (Artifactory responses, Bitbucket payloads,
  registry JSON) MUST be validated at the boundary and cast
  to typed interfaces before use.
- Shared types MUST live in a dedicated `types/` directory and
  be imported explicitly.

**Rationale**: The tool catalog and registry are the backbone
of Dev Hub. Untyped data flows cause silent runtime failures
that are hard to debug in an extension context.

### III. Test-First (NON-NEGOTIABLE)

All features MUST follow the Test-Driven Development cycle:

- Tests MUST be written before implementation code.
- Tests MUST fail (red) before any implementation begins.
- Implementation MUST target making failing tests pass (green)
  with the simplest correct solution.
- Refactoring MUST only occur after tests pass, and MUST NOT
  change behavior (refactor).
- Integration tests are REQUIRED for: tool launch flows,
  Artifactory/Bitbucket fetches, and registry data loading.
- Unit tests are REQUIRED for: service logic, type validators,
  and utility functions.

**Rationale**: TDD catches extension API misuse and type
boundary errors early. Without it, bugs surface only at
runtime inside VS Code — a slow and painful feedback loop.

## Technology Constraints

- **Language**: TypeScript (strict mode)
- **Platform**: VS Code Extension API
- **Registry**: Static JSON with generated TypeScript types
- **Distribution**: VSIX packaging
- **Package Manager**: npm
- **External Integrations**: Artifactory, Bitbucket, npm
  registry — all accessed through typed service abstractions
- **No runtime dependencies** on frameworks beyond what
  `@types/vscode` provides unless explicitly justified and
  approved

## Development Workflow

- Every feature begins with a specification (`/speckit.specify`)
  before any code is written.
- Implementation follows the plan → tasks → implement cycle
  using the speckit workflow.
- All PRs MUST pass TypeScript compilation with zero errors and
  zero warnings before merge.
- All PRs MUST include tests that were written before the
  implementation they verify.
- Commit messages MUST follow conventional commits format
  (e.g., `feat:`, `fix:`, `test:`, `docs:`).

## Governance

This constitution is the highest-authority document for the
AEP Dev Hub project. All development decisions, code reviews,
and architectural choices MUST comply with the principles
defined above.

- **Amendment procedure**: Any change to this constitution
  MUST be proposed as a PR with a clear rationale, reviewed,
  and approved before merge. The Sync Impact Report (HTML
  comment at the top of this file) MUST be updated with every
  amendment.
- **Versioning**: This constitution follows semantic versioning.
  MAJOR for principle removals or redefinitions, MINOR for new
  principles or material expansions, PATCH for clarifications
  and wording fixes.
- **Compliance review**: All PRs and code reviews MUST verify
  compliance with the active constitution version. Violations
  MUST be flagged and resolved before merge.
- **Runtime guidance**: Use `.specify/` templates and commands
  for day-to-day development guidance that implements these
  principles.

**Version**: 1.0.0 | **Ratified**: 2026-04-01 | **Last Amended**: 2026-04-01
