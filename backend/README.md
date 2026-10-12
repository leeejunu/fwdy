# Forward Backend

Spring Boot REST API for the forwarding quote workspace.

## Requirements

- JDK 21
- Docker Desktop for local PostgreSQL

## Run locally

```bash
docker compose up -d postgres
./gradlew bootRun
```

The default Spring profile is `local`. To select it explicitly, use
`./gradlew bootRun --args='--spring.profiles.active=local'`.
The local profile optionally imports `backend/.env` as a properties file. Put
local-only values such as `OPENAI_API_KEY` there; `.env` is ignored by Git. Copy
the key name from `.env.example` if setting up a fresh checkout.

Mail analysis uses Spring AI with OpenAI. Set `OPENAI_API_KEY` in `backend/.env`
before calling the analysis endpoint. `OPENAI_MODEL` can optionally select a
different model; it defaults to `gpt-5-mini`.

The local API listens on `http://localhost:8081`. The local PostgreSQL
container uses port `55432` by default so it does not conflict with other local
PostgreSQL services. Set `SERVER_PORT` or `POSTGRES_PORT` to override either.

- Health API: `GET /api/health`
- Actuator health: `GET /actuator/health`
- Create and persist quote analysis: `POST /api/quote-analyses`
- List the current user's saved analyses: `GET /api/quote-analyses`
- Read a saved analysis: `GET /api/quote-analyses/{id}`

The mail analysis request accepts `shipperMail`, `consoleMail`, and
`cargoSettings`. On successful extraction it stores the original messages,
calculation settings, and normalized AI result in PostgreSQL, then returns the
created record. Archive reads these saved records from the API. Production
records are scoped to the authenticated Supabase user's JWT subject. Local
development uses the local PostgreSQL container by default; production uses the
`DATABASE_URL` configured for Supabase in the deployment environment.

Flyway applies the versioned schema migrations at application startup. The
quote table has Row Level Security enabled and no browser-role policies; use the
authenticated backend API for access so ownership checks remain enforced.

## Production profile

Run with `SPRING_PROFILES_ACTIVE=prod`. Configure these environment variables in
the deployment environment; production has no local database or CORS defaults:

- `DATABASE_URL` — JDBC URL, for example `jdbc:postgresql://db-host:5432/forward`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `CORS_ALLOWED_ORIGINS` — comma-separated frontend origins
- `OPENAI_API_KEY`
- `OPENAI_MODEL` — optional, defaults to `gpt-5-mini`
- `SUPABASE_ISSUER_URI` — Supabase Auth JWT issuer, for example `https://<project-ref>.supabase.co/auth/v1`
- `SUPABASE_JWKS_URI` — matching signing-key URL, for example `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`
- `SERVER_PORT` — optional, defaults to `8080` in production (`8081` locally)

Production API routes under `/api/**` require a valid Supabase Auth access token. The health route remains public. Local profile security is intentionally permissive for development.

For a manual EC2 run, keep the untracked `backend/env.production` file populated
with production values, then export it into the process environment before
starting the app:

```bash
set -a
. ./env.production
set +a
SPRING_PROFILES_ACTIVE=prod ./gradlew bootRun
```

The file is intentionally ignored by Git. For a managed deployment, configure
the same values using the platform's environment-variable or secrets settings.

Add schema changes under `src/main/resources/db/migration` as Flyway SQL
migrations.
