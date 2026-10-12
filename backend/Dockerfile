# Build the Spring Boot executable JAR with the project's Java 21 toolchain.
FROM gradle:9.7.1-jdk21 AS builder

WORKDIR /workspace

COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
COPY src ./src

RUN ./gradlew --no-daemon clean bootJar \
    && app_jar="$(find build/libs -maxdepth 1 -type f -name '*.jar' ! -name '*-plain.jar' -print -quit)" \
    && test -n "$app_jar" \
    && cp "$app_jar" /workspace/app.jar

# Keep the runtime image smaller and run the service as an unprivileged user.
FROM eclipse-temurin:21-jre-jammy AS runtime

WORKDIR /app

RUN groupadd --system --gid 10001 fwdy \
    && useradd --system --uid 10001 --gid fwdy --home-dir /app --shell /usr/sbin/nologin fwdy

COPY --from=builder --chown=fwdy:fwdy /workspace/app.jar /app/app.jar

USER fwdy:fwdy

EXPOSE 8080

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
