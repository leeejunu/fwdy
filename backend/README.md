# Forward Backend

Spring Boot REST API for the forwarding quote workspace.

## Requirements

- JDK 21
- A Supabase project (the same project used by the local frontend)
- Supabase database password

## Run locally

```bash
./gradlew bootRun
```

The default Spring profile is `local`. To select it explicitly, use
`./gradlew bootRun --args='--spring.profiles.active=local'`.
The local profile connects to Supabase PostgreSQL. `src/main/resources/application-local.yml`
is ignored by Git; create it from `application-local.example.yml` if it does not
already exist. Copy `.env.example` to `.env`, then set the Supabase project ref,
the connection details from Supabase **Connect**, and the database password. For IPv4-only
networks, use the Session pooler values. Keep the frontend's
`NEXT_PUBLIC_SUPABASE_URL`, the JWT issuer/JWKS URLs, and the database connection
on the same Supabase project. The JDBC URL uses `sslmode=require`.

The local profile imports `backend/.env` as a properties file. Put local-only
values such as `OPENAI_API_KEY` and `SUPABASE_DB_PASSWORD` there; `.env` is
ignored by Git. Copy the key names from `.env.example` when setting up a fresh
checkout.

Mail analysis uses Spring AI with OpenAI. Set `OPENAI_API_KEY` in `backend/.env`
before calling the analysis endpoint. `OPENAI_MODEL` can optionally select a
different model; it defaults to `gpt-5-mini`.

The local API listens on `http://localhost:8081`.

- Health API: `GET /api/health`
- Actuator health: `GET /actuator/health`
- Create and persist quote analysis: `POST /api/quote-analyses`
- List the current user's saved analyses: `GET /api/quote-analyses`
- Read a saved analysis: `GET /api/quote-analyses/{id}`

The mail analysis request accepts `shipperMail`, `consoleMail`, and
`cargoSettings`. On successful extraction it stores the original messages,
calculation settings, and normalized AI result in PostgreSQL, then returns the
created record. Archive reads these saved records from the API. Records are
scoped to the authenticated Supabase user's JWT subject. Both local development
and production use Supabase PostgreSQL, with profile-specific connection
settings.

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
