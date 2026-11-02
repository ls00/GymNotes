# GymNotes — Project Structure

## Classification and boundaries

**Project type:** full-stack application with separately deployable frontend and backend directories; the repository does not show a root workspace/build orchestrator.

| Module | Path | Runtime role |
|---|---|---|
| Frontend | `frontend/` | Next.js App Router web app/PWA; browser-facing React UI |
| Backend | `backend/` | Spring Boot REST API, JWT security, JPA persistence, WebSocket/STOMP notifications |
| Slides | `gymnotes-slides/` | Product presentation assets; not application runtime code |

## Backend layers and source counts

Counts are Java source files under `backend/src/main/java/com/gymnotes`; generated `target/` files are excluded.

| Package/layer | Files | Responsibility |
|---|---:|---|
| Application entrypoint | 1 | Spring Boot bootstrap (`GymNotesApplication.main`) |
| `config` | 2 | OpenAPI and STOMP/WebSocket setup |
| `controller` | 5 | REST entrypoints: auth, profile, workouts, nutrition, social |
| `service` | 5 | Domain workflows and transaction boundaries |
| `repository` | 10 | Spring Data JPA queries and progress/feed retrieval |
| `domain` | 16 | 10 JPA entities and 6 enums |
| `dto` | 24 | Request/response types for REST |
| `security` | 5 | JWT authentication, user principal, Spring Security wiring |
| `exception` | 5 | Domain exceptions, error DTO, global exception handler |
| **Total** | **73** | |

### Backend request path

`HTTP → Spring Security/JWT filter → controller → service (@Transactional) → repository → PostgreSQL`

Services return DTOs, with entity-to-DTO mapping in DTO factory methods. `GlobalExceptionHandler` maps validation and domain/security errors to JSON responses.

## Frontend layers and source counts

Counts are `.ts`/`.tsx` files under `frontend/src`; CSS is excluded.

| Area | Files | Responsibility |
|---|---:|---|
| `app/` | 7 TS/TSX + global CSS | App Router pages/layouts, auth route, dashboard shell and three feature pages |
| `components/` | 3 | Header/navigation and React Query provider |
| `hooks/` | 4 | Auth, workout, nutrition, and feed queries/mutations |
| `services/` | 1 | Shared Axios API client |
| `types/` | 1 | Shared API/domain TypeScript interfaces |
| `lib/` | 1 | Shared class-name utility |
| **Total** | **17 TS/TSX** | |

### Frontend request path

`App Router page → feature hook → React Query → shared Axios client → /api/v1 backend`

The client attaches a bearer token from browser `localStorage`; a 401 clears the stored token/user values and redirects to `/login`. The dashboard layout checks for the access token client-side.

## Entrypoints and routes

### Frontend

| Route | Source | Behavior |
|---|---|---|
| `/` | `frontend/src/app/page.tsx` | Redirects to `/workouts` |
| `/login` | `frontend/src/app/(auth)/login/page.tsx` | Login and registration form |
| `/workouts` | `frontend/src/app/(dashboard)/workouts/page.tsx` | Workout logging, plans, history |
| `/nutrition` | `frontend/src/app/(dashboard)/nutrition/page.tsx` | Daily nutrition summary and quick meal entry |
| `/feed` | `frontend/src/app/(dashboard)/feed/page.tsx` | Feed, likes, comments, share |

The dashboard route group wraps pages in a client-side session check. Mobile and desktop navigation links to workouts, nutrition, and feed. `public/manifest.json` advertises the PWA and includes shortcuts to `/workouts/active` and `/nutrition/log`; no matching page files are present in the current App Router tree.

The existing validation report also notes API-backed profile/goals, food creation, and friendship response operations without corresponding user-facing pages; the frontend stores refresh tokens but has no refresh route/client flow; and the backend sends WebSocket notifications without a matching frontend STOMP consumer in `frontend/package.json`/`frontend/src`. These are current integration boundaries, not implementation decisions.

### Backend

The application entrypoint is `backend/src/main/java/com/gymnotes/GymNotesApplication.java`. Five controllers expose 18 REST operations across 16 unique paths under `/api/v1`; see `wire_contracts.yaml` for their full method/path list. `WebSocketConfig` exposes STOMP endpoints at `/ws` (native and SockJS).

## Functional areas

- **Authentication and profile:** registration/login, JWT issuance, authenticated profile read/update and daily goals.
- **Workout tracking:** plans, seeded exercise catalog, session/set recording, history, exercise progress.
- **Nutrition tracking:** food search/catalog, meal logging, calculated daily calories/macros compared to user goals.
- **Social:** friendship request and response, combined activity feed, likes/comments, outbound WebSocket notification messages.
- **Application shell/PWA:** protected dashboard, responsive navigation, install metadata and icons.

## Configuration and persistence

- Backend Maven build: `backend/pom.xml`; runtime configuration: `backend/src/main/resources/application.yml` and `application-prod.yml`.
- Flyway migrations: `backend/src/main/resources/db/migration/`; Hibernate is configured to validate the existing schema, not generate it.
- Frontend dependency/build configuration: `frontend/package.json`, `package-lock.json`, `tsconfig.json`, ESLint, Tailwind and PostCSS configuration.
- Browser API URL is configured via `NEXT_PUBLIC_API_URL`; `.env.example` contains a local example.
- Backend configuration uses environment variables for port, database, CORS, JWT, media-storage settings, and public OpenAPI URL.

## Existing validation evidence

`TEST_PLAN_AND_REPORT.md` records a previous successful frontend lint/build, five passing backend unit tests, and 26 passing live smoke tests against deployed endpoints. Its smoke assertion checks 16 OpenAPI path keys; the controller source defines 18 HTTP method/path operations across those 16 paths. The checked-in test sources comprise three backend test classes and one Node smoke-test file; there is no dedicated frontend unit/component test suite in the listed package scripts. This analysis did not rerun those validations.
