# GymNotes — Tech Stack

This document records the stack declared in repository build/configuration files. Spring Boot-managed dependency versions are not individually pinned in `pom.xml`; direct frontend versions below include the resolved versions in `package-lock.json`.

## Runtime and language

| Area | Declared runtime |
|---|---|
| Backend | Java 25 (`java.version` in `backend/pom.xml`); Docker build uses Maven 3.9.16 with Eclipse Temurin 25 and runs on Temurin 25 JRE |
| Frontend | TypeScript 5.x; Node.js `>=20.9.0`; React 19; Next.js 16 App Router |
| Database | PostgreSQL, accessed through Spring Data JPA/Hibernate |

## Backend frameworks and dependencies

| Dependency | Version in repository |
|---|---|
| Spring Boot parent | 3.5.16 |
| `spring-boot-starter-web` | Managed by Spring Boot parent |
| `spring-boot-starter-data-jpa` | Managed by Spring Boot parent |
| `spring-boot-starter-security` | Managed by Spring Boot parent |
| `spring-boot-starter-validation` | Managed by Spring Boot parent |
| `spring-boot-starter-websocket` | Managed by Spring Boot parent |
| PostgreSQL JDBC driver | Managed by Spring Boot parent; runtime scope |
| Flyway `flyway-core` | Managed by Spring Boot parent |
| Flyway `flyway-database-postgresql` | Managed by Spring Boot parent |
| Auth0 `java-jwt` | 4.4.0 |
| `springdoc-openapi-starter-webmvc-ui` | 2.10.0 |
| Lombok | 1.18.42 annotation processor; optional compile dependency |
| `spring-boot-starter-test` | Managed by Spring Boot parent; test scope |
| `spring-security-test` | Managed by Spring Boot parent; test scope |

Build and wiring: Maven, Spring Boot Maven plugin, Maven Compiler Plugin, Lombok annotation processing. The repository does not pin the Spring Boot-managed transitive versions separately in the POM.

## Frontend direct dependencies

| Package | Manifest range | Lockfile version |
|---|---:|---:|
| `@tanstack/react-query` | `^5.59.0` | 5.104.5 |
| `axios` | `^1.7.7` | 1.20.0 |
| `clsx` | `^2.1.1` | 2.1.1 |
| `framer-motion` | `^11.11.9` | 11.18.2 |
| `lucide-react` | `^0.453.0` | 0.453.0 |
| `next` | `16.4.3` | 16.4.3 |
| `react` | `^19.3.1` | 19.3.1 |
| `react-dom` | `^19.3.1` | 19.3.1 |
| `tailwind-merge` | `^2.5.4` | 2.6.1 |

### Frontend development dependencies

| Package | Manifest range | Lockfile version |
|---|---:|---:|
| `@types/node` | `^20.16.11` | 20.19.43 |
| `@types/react` | `^19.3.0` | 19.3.0 |
| `@types/react-dom` | `^19.3.0` | 19.3.0 |
| `autoprefixer` | `^10.6.1` | 10.6.1 |
| `eslint` | `^9.39.5` | 9.39.5 |
| `eslint-config-next` | `16.4.3` | 16.4.3 |
| `postcss` | `^8.4.47` | 8.5.31 |
| `tailwindcss` | `^3.4.14` | 3.4.19 |
| `typescript` | `^5.6.3` | 5.9.3 |

Frontend scripts: `next dev`, `next build`, `next start`, `eslint .`, and Node's built-in test runner for `scripts/live-smoke.test.mjs`. TypeScript has `strict: true`, `noEmit: true`, and the `@/*` alias to `src/*`.

## Persistence, protocols, and libraries

- PostgreSQL with `spring-boot-starter-data-jpa`; Hibernate uses `ddl-auto: validate`, `open-in-view: false`, and configured JDBC batching.
- Flyway migrations are enabled and validated at startup.
- REST API uses Spring MVC and JSON DTOs; OpenAPI UI/docs use Springdoc.
- JWT bearer auth uses Auth0 `java-jwt`; passwords use Spring Security BCrypt.
- WebSocket messaging uses Spring WebSocket/STOMP with the simple in-memory broker and SockJS endpoint.
- Frontend server-rendering/routing is Next.js App Router; client state/data fetching uses TanStack React Query and Axios.
- Styling uses Tailwind CSS 3, PostCSS, and Autoprefixer; icons use Lucide React; animation uses Framer Motion.
- The backend config includes an S3-compatible media-storage provider/endpoint/bucket/key setting set; no corresponding storage SDK/client dependency appears in `pom.xml`.

## Configuration inputs

- Backend: `PORT`, database host/port/name/user/password, `CORS_ALLOWED_ORIGINS`, `JWT_SECRET`, `STORAGE_PROVIDER`, `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `SPRING_DATASOURCE_URL`, and `API_PUBLIC_URL`.
- Frontend: `NEXT_PUBLIC_API_URL`; default in the Axios client is `http://localhost:8080`.
- Local fallback credentials/secrets are explicitly marked as local-only in `application.yml`; production profile expects injected values.
- Production profile sets lazy initialization and an externally supplied datasource URL.

## Compatibility/deprecation evidence

No dependency is classified as end-of-life based only on these source files. The existing `TEST_PLAN_AND_REPORT.md` mentions a deprecation warning in `SecurityConfig` from a previous build, but does not identify the API or compiler diagnostic; that report is evidence of a warning, not enough to name a deprecated method here.
