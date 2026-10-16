# Build the executable Spring Boot JAR with the project's Java 21 toolchain.
FROM eclipse-temurin:21-jdk-jammy AS builder

WORKDIR /workspace/app

COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
COPY src ./src

RUN ./gradlew --no-daemon bootJar -x test \
    && app_jar="$(find build/libs -maxdepth 1 -type f -name '*.jar' ! -name '*-plain.jar' -print -quit)" \
    && test -n "$app_jar" \
    && cp "$app_jar" /workspace/app/app.jar

# Keep only the Java 21 runtime and executable JAR in the final image.
FROM eclipse-temurin:21-jre-jammy AS runtime

WORKDIR /app

COPY --from=builder /workspace/app/app.jar /app/app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
