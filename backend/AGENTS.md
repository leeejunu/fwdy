# Backend Agent Instructions

Before making backend changes, read [`docs/architecture.md`](docs/architecture.md) and follow its architecture, package, data, and AI rules.

- Keep Java 21 and the existing Spring Boot/Gradle setup.
- Do not commit secrets or introduce dummy business data unless explicitly requested.
- Run `./gradlew test` and `./gradlew build` when JDK 21 is available; otherwise report that verification is blocked by the missing toolchain.
