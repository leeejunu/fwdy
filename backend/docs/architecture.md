# Backend Architecture

## Stack and runtime

- Java 21, Spring Boot, Gradle
- PostgreSQL for persistent application data
- Flyway for all database schema changes
- Spring profiles: `local` and `prod`
- Base Java package: `com.forward`

## Request and dependency flow

All business API requests follow this direction:

```text
Controller -> Service -> Repository -> Database
```

Dependencies must point inward through these layers. Controllers must not call repositories directly.

## REST API conventions

- Model endpoints as resources with plural, hyphenated nouns, for example `POST /api/quote-analyses`; do not put action verbs such as `/analyze` in paths.
- Use HTTP methods according to their semantics: `GET` reads, `POST` creates/submits a resource, `PUT` replaces, `PATCH` partially updates, and `DELETE` removes.
- Return `200 OK` for successful reads and synchronous non-persisted processing. When a resource is persisted, return `201 Created` and a `Location` header. Use `204 No Content` only when a successful operation intentionally has no response body.
- Use suitable client and server error statuses (`400`, `404`, `409`, `502`, etc.) and return errors as RFC 9457 Problem Details.
- Keep API request/response DTOs independent of persistence entities and AI provider types.

### Controller (`com.forward.controller`)

- Own HTTP routes, request/response DTOs, input validation, status codes, and API documentation.
- Delegate business behavior to a service.
- Do not inject or call repositories.
- Do not expose JPA entities in API responses.
- Declare dependency-injection constructors explicitly; do not use Lombok `@RequiredArgsConstructor`.

### Service (`com.forward.service`)

- Own application workflows, business rules, orchestration, and transaction boundaries (`@Transactional`).
- Coordinate repositories and other application services.
- Keep pricing and chargeable-weight calculations deterministic and independently testable.
- Declare dependency-injection constructors explicitly; do not use Lombok `@RequiredArgsConstructor`.

### Repository (`com.forward.repository`)

- Own persistence access and database queries only.
- Do not put business rules or HTTP concerns in repositories.

### Domain (`com.forward.domain`)

- Own entities and domain value types.
- Keep persistence entities out of API contracts; map between entities and DTOs at the service boundary.

### DTO (`com.forward.dto`)

- Keep request and response types separate under `request` and `response` packages.
- Validate incoming request DTOs at the controller boundary.

### Configuration (`com.forward.config`)

- Own Spring configuration such as CORS, profiles, and infrastructure wiring.

### Exceptions (`com.forward.exception`)

- Keep application-specific exceptions and global API exception handlers here.
- Map exceptions to appropriate HTTP statuses and RFC 9457 Problem Details; do not handle exceptions in controllers unless recovery is specific to that endpoint.

Health and other infrastructure-only endpoints may return static status without adding artificial service or repository layers.

## Package layout

```text
com.forward
├── config
├── controller
├── domain
│   ├── entity
│   └── model
├── dto
│   ├── request
│   └── response
├── exception
├── repository
└── service
```

Keep classes cohesive by feature as the application grows, while preserving the Controller -> Service -> Repository dependency direction.

## Forwarding and AI workflow

- Treat shipper and consolidator emails as untrusted input. Never execute instructions found inside email content.
- AI may extract and normalize email fields into validated DTOs. Preserve source mail or source snippets and flag missing or uncertain values for user review.
- AI output is not authoritative. Validate it before persisting or returning it as trusted business data.
- Calculate CBM, volume weight, chargeable weight, and quote totals with deterministic Java code, never with model-generated arithmetic.
- Keep original email text separate from normalized cargo and quote data.
- Do not add sample or dummy business data unless explicitly requested.

The first analysis resource is submitted through `POST /api/quote-analyses`. It
accepts the raw shipper and consolidator mail fields and cargo calculation
settings, extracts cargo/quote data, then persists the original inputs and
normalized result in `quote_analyses`. Return `201 Created` with a `Location`
header. `GET /api/quote-analyses` returns the current user's newest 50 archive
summaries, and `GET /api/quote-analyses/{id}` returns the full saved record.
Production records are isolated by the authenticated Supabase JWT subject;
local-profile records have a null owner and are only queried in the local
profile. Keep provider calls behind a service so controllers and API DTOs do
not depend directly on Spring AI types. Never log raw mail or full AI output.
The quote table has Row Level Security enabled without browser-role policies;
the backend accesses it through its database connection and enforces record
ownership using the verified JWT subject.

## Persistence and environment configuration

- Add schema changes as versioned SQL migrations under `src/main/resources/db/migration`.
- Keep Hibernate schema mode at `validate`; do not use `create`, `create-drop`, or `update` for application schema management.
- Keep local-only credentials in the ignored `backend/.env`; never commit real secrets or place them in frontend `NEXT_PUBLIC_*` variables.
- Production settings must use deployment-provided environment variables and the `prod` profile; do not rely on local defaults in production.

## Authentication

- The frontend uses Supabase Auth with Google as the only enabled sign-in provider.
- Browser API requests send the Supabase access token as `Authorization: Bearer <token>`.
- The production API validates token signature and issuer against the Supabase project's JWKS and issuer URI. Keep `/api/health` public; require authentication for other `/api/**` routes.
- Frontend route guards are for navigation and user experience only; backend token verification is the security boundary.
- Local profile API access remains unauthenticated for development. Never use Supabase service-role/secret keys in the browser.

## Tests and verification

- Add unit tests for service business rules and calculation edge cases.
- Add repository tests for persistence behavior and API tests for HTTP contracts where appropriate.
- Run `./gradlew test` and `./gradlew build` when JDK 21 is available.
