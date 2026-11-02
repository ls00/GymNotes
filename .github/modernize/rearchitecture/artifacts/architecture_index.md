# GymNotes — Architecture Index

## Implementation Guide

This index maps the existing application for future feature work. The analysis is based on the checked-in source and the existing validation report; it does not define a migration or authorize schema changes.

This index is not the full contract. Do not implement from this file alone; follow the artifact paths below.

## Global artifacts

- `project-structure.md`
  - Who reads: all contributors.
  - Use for: application boundaries, layers, entrypoints, and source counts.
- `tech-stack.md`
  - Who reads: all contributors.
  - Use for: declared frameworks, runtimes, dependencies, and configuration.
- `data-model.md`
  - Who reads: contributors changing persistence, nutrition, workouts, users, or social features.
  - Use for: the current relational schema, entity fields, relationships, and transaction scope. It documents the current model, not a redesign.
- `unit_graph.yaml`
  - Who reads: all contributors.
  - Use for: units, externally triggered routes/pages, source anchors, dependencies, and shared references.
  - How to consume: locate the assigned unit; read its `source_anchors`, `depends_on`, and `shared_refs`.
- `wire_contracts.yaml`
  - Who reads: contributors changing API routes, payloads, errors, or notifications.
  - Use for: current HTTP and notification-facing contracts.
  - How to consume: filter `contracts` by the assigned unit; preserve current contracts unless a feature explicitly changes them.
- `shared_modules.yaml`
  - Who reads: contributors changing shared code or data entities.
  - Use for: shared frontend infrastructure and cross-domain entities/DTOs.
  - How to consume: filter `modules` by `used_by_units`; `shared_refs.used_fields` in the graph is a field whitelist.
- `cross_unit_state.yaml`
  - Who reads: contributors changing authentication, API calls, persisted activities, or the social feed.
  - Use for: state flows between independently triggered units.
  - How to consume: filter flows where `writer.unit` or `reader.unit` matches the assigned unit; runtime confirmation is called out where static pairing is incomplete.
- `seams.yaml` and `migration_boundary.yaml` are intentionally absent: this request is an analysis for future features, not a partial migration or rewrite.

## Unit artifacts

Every unit has `behavior.yaml`, `bindings.yaml`, and `unit_decomposition.yaml`. Decomposition entries are advisory only (`commit: false`).

### `api-auth`
- External trigger: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`.
- Read: `units/api-auth/behavior.yaml` for registration/login outcomes and transaction scope; `units/api-auth/bindings.yaml` for Spring routes, validation, and JWT config; `units/api-auth/unit_decomposition.yaml` for optional split candidates.
- Global rows: `wire_contracts.yaml` rows for `api-auth`; `shared_modules.yaml` rows for `User` and `UserResponseDTO`; `cross_unit_state.yaml` flows involving `ui-auth`.
- Before DONE report: artifacts read, preserved response/validation behavior, unresolved contracts, and relevant test/build/runtime evidence.

### `api-profile`
- External trigger: `GET /api/v1/users/me`, `PUT /api/v1/users/me`.
- Read: `units/api-profile/behavior.yaml`, `units/api-profile/bindings.yaml`, `units/api-profile/unit_decomposition.yaml`.
- Global rows: `wire_contracts.yaml` rows for `api-profile`; `shared_modules.yaml` rows for `User` and `UserResponseDTO`; `cross_unit_state.yaml` only if profile changes affect another unit's state.
- Before DONE report: artifacts read, preserved ownership/partial-update behavior, unresolved contracts, and verification evidence.

### `api-workouts`
- External trigger: workout plan, exercise search, session history/creation, and exercise progress REST routes under `/api/v1/workouts`.
- Read: `units/api-workouts/behavior.yaml`, `units/api-workouts/bindings.yaml`, `units/api-workouts/unit_decomposition.yaml`.
- Global rows: `wire_contracts.yaml` rows for `api-workouts`; `shared_modules.yaml` rows for `User` and `WorkoutSession`; `cross_unit_state.yaml` flows from workout sessions to `api-social`.
- Before DONE report: artifacts read, preserved session/set and transaction behavior, unresolved contracts, and verification evidence.

### `api-nutrition`
- External trigger: food search/creation, meal logging, and daily summary routes under `/api/v1/nutrition`.
- Read: `units/api-nutrition/behavior.yaml`, `units/api-nutrition/bindings.yaml`, `units/api-nutrition/unit_decomposition.yaml`.
- Global rows: `wire_contracts.yaml` rows for `api-nutrition`; `shared_modules.yaml` rows for `User` and `MealLog`; `cross_unit_state.yaml` flows from meal logs to `api-social`.
- Before DONE report: artifacts read, preserved calculations/date behavior and transaction scope, unresolved contracts, and verification evidence.

### `api-social`
- External trigger: friend requests/responses, feed, interactions, and notifications under `/api/v1/social` and `/ws`.
- Read: `units/api-social/behavior.yaml`, `units/api-social/bindings.yaml`, `units/api-social/unit_decomposition.yaml`.
- Global rows: `wire_contracts.yaml` rows for `api-social`; `shared_modules.yaml` rows for `User`, `WorkoutSession`, and `MealLog`; `cross_unit_state.yaml` flows read from workouts/nutrition.
- Before DONE report: artifacts read, preserved feed visibility, friendship/interaction rules, notification behavior, unresolved contracts, and verification evidence.

### `ui-auth`
- External trigger: `GET /login`.
- Read: `units/ui-auth/behavior.yaml`, `units/ui-auth/bindings.yaml`, `units/ui-auth/unit_decomposition.yaml`.
- Global rows: `wire_contracts.yaml` rows for `api-auth` and `api-profile`; `shared_modules.yaml` rows for `ApiClient` and `QueryProvider`; `cross_unit_state.yaml` token flow to `ui-dashboard`.
- Before DONE report: artifacts read, preserved login/register/error and token-storage behavior, unresolved contracts, and verification evidence.

### `ui-workouts`
- External trigger: `GET /workouts`.
- Read: `units/ui-workouts/behavior.yaml`, `units/ui-workouts/bindings.yaml`, `units/ui-workouts/unit_decomposition.yaml`.
- Global rows: `wire_contracts.yaml` rows for `api-workouts`; `shared_modules.yaml` rows for `ApiClient`, `QueryProvider`, `DashboardShell`, and `WorkoutSession`; `cross_unit_state.yaml` token and feed invalidation flows.
- Before DONE report: artifacts read, preserved workout form/session/timer/error behavior, unresolved contracts, and verification evidence.

### `ui-nutrition`
- External trigger: `GET /nutrition`.
- Read: `units/ui-nutrition/behavior.yaml`, `units/ui-nutrition/bindings.yaml`, `units/ui-nutrition/unit_decomposition.yaml`.
- Global rows: `wire_contracts.yaml` rows for `api-nutrition`; `shared_modules.yaml` rows for `ApiClient`, `QueryProvider`, `DashboardShell`, and `MealLog`; `cross_unit_state.yaml` token and feed invalidation flows.
- Before DONE report: artifacts read, preserved summary/quick-entry/error behavior, unresolved contracts, and verification evidence.

### `ui-social`
- External trigger: `GET /feed`.
- Read: `units/ui-social/behavior.yaml`, `units/ui-social/bindings.yaml`, `units/ui-social/unit_decomposition.yaml`.
- Global rows: `wire_contracts.yaml` rows for `api-social`; `shared_modules.yaml` rows for `ApiClient`, `QueryProvider`, `DashboardShell`, `WorkoutSession`, and `MealLog`; `cross_unit_state.yaml` token and activity flows.
- Before DONE report: artifacts read, preserved feed/like/comment/share behavior, unresolved contracts, and verification evidence.

### `ui-dashboard`
- External trigger: dashboard route group shared by `/workouts`, `/nutrition`, and `/feed`.
- Read: `units/ui-dashboard/behavior.yaml`, `units/ui-dashboard/bindings.yaml`, `units/ui-dashboard/unit_decomposition.yaml`.
- Global rows: `shared_modules.yaml` rows for `DashboardShell`, `QueryProvider`, and `ApiClient`; `cross_unit_state.yaml` browser-token flow.
- Before DONE report: artifacts read, preserved session gate/navigation behavior, unresolved contracts, and verification evidence.

### `ui-root`
- External trigger: `GET /`.
- Read: `units/ui-root/behavior.yaml`, `units/ui-root/bindings.yaml`, `units/ui-root/unit_decomposition.yaml`.
- Global rows: `unit_graph.yaml` route and dependency data; `shared_modules.yaml` `QueryProvider` and `DashboardShell`.
- Before DONE report: artifacts read, preserved redirect behavior, unresolved contracts, and verification evidence.
