# FWDY

포워딩 견적 업무를 메일 입력부터 운임 검토까지 한 흐름으로 정리하는 웹 애플리케이션입니다.

화주 메일과 콘솔사 회신을 원문 그대로 입력하면 AI가 화물·목적지·운임·스케줄 정보를 구조화합니다. 사용자는 추출 결과를 확인하고 계산값을 검토한 뒤, 저장된 견적을 Archive에서 다시 열 수 있습니다.

## 주요 기능

- 화주 메일과 콘솔사 메일을 구분해 원문 입력
- AI 기반 화물 정보, 목적지, 운임 제안 및 스케줄 추출
- 부피중량 나눗수, C/W 절상 단위, 적용 중량 기준, 적재 조건 설정
- 계산 근거와 운임 항목을 확인하고 추출값 수정
- 분석 성공 시 메일 원문, 화물 설정, 분석 결과를 PostgreSQL에 저장
- 날짜별 견적 Archive 및 저장 기록 다시 열기
- Google 로그인을 사용하는 Supabase Auth

AI 추출값은 검토가 필요한 초안입니다. 실제 견적에 사용하기 전에 메일 원문과 대조해 주세요.

## 기술 구성

| 영역 | 기술 |
| --- | --- |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend | Java 21, Spring Boot 4, Spring AI |
| Database | PostgreSQL, Flyway |
| Authentication | Supabase Auth (Google) |
| AI extraction | OpenAI API |

개발 환경은 로컬 PostgreSQL 컨테이너를 사용하고, 운영 환경은 `DATABASE_URL`로 연결된 Supabase PostgreSQL을 사용합니다. 프론트엔드는 백엔드 REST API를 호출하며, 운영 API는 Supabase JWT를 검증해 사용자별 견적 기록을 분리합니다.

## 요청 흐름

1. 화주 메일, 콘솔사 메일, 화물 계산 설정을 입력합니다.
2. 프론트엔드가 `POST /api/quote-analyses`로 전송합니다.
3. 백엔드가 AI 추출 결과를 정규화하고 PostgreSQL에 저장합니다.
4. 검토 화면에서 화물과 운임 계산을 확인·수정합니다.
5. Archive는 API에서 사용자별 기록을 가져오며, 선택한 견적의 원문과 결과를 다시 불러옵니다.

## 시작하기

### 준비물

- Node.js 20 이상 및 npm
- JDK 21
- Docker Desktop
- Supabase 프로젝트 및 Google 로그인 설정
- 메일 분석을 위한 OpenAI API 키

### 1. Backend와 로컬 DB 실행

```bash
cd backend
docker compose up -d postgres
```

로컬 설정은 기본적으로 `localhost:55432`의 `forward` 데이터베이스를 사용합니다. `backend/.env` 파일을 만들고 OpenAI 키를 설정하세요.

```properties
OPENAI_API_KEY=발급한_API_키
OPENAI_MODEL=gpt-6-luna
```

그 다음 백엔드를 실행합니다.

```bash
./gradlew bootRun
```

기본 API 주소는 `http://localhost:8081`입니다. 애플리케이션 시작 시 Flyway가 DB 마이그레이션을 적용합니다.

### 2. Frontend 실행

```bash
cd frontend
npm ci
```

`frontend/.env.development` 파일을 만들고 다음 값을 설정합니다.

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

```bash
npm run dev
```

개발 화면은 `http://localhost:3000`에서 엽니다. `NEXT_PUBLIC_API_BASE_URL`은 프론트엔드 빌드 시 반영되므로 운영 빌드에는 운영 API 주소를 설정해야 합니다.

## API

| Method | Endpoint | 설명 |
| --- | --- | --- |
| `GET` | `/api/health` | 상태 확인 |
| `POST` | `/api/quote-analyses` | 메일 분석 및 견적 기록 생성 |
| `GET` | `/api/quote-analyses` | 최신 견적 기록 목록 조회 |
| `GET` | `/api/quote-analyses/{id}` | 견적 기록과 원문 상세 조회 |

분석 요청 예시:

```json
{
  "shipperMail": "화주 메일 원문",
  "consoleMail": "콘솔사 메일 원문",
  "cargoSettings": "{\"volumeDivisor\":\"6000\",\"roundUnit\":\"1\"}"
}
```

분석이 성공하면 `201 Created`와 생성된 기록을 반환합니다. API 전체 구조는 [Backend README](backend/README.md)를 참고하세요.

## 데이터와 보안

- 원문 메일은 분석 성공 후 PostgreSQL에 저장됩니다.
- 운영 데이터베이스 주소와 계정은 백엔드 런타임 환경변수로 설정합니다. 비밀값을 프론트엔드의 `NEXT_PUBLIC_*` 변수에 넣지 마세요.
- 운영 API는 Supabase access token을 검증하고, JWT subject 기준으로 기록 소유권을 확인합니다.
- `quote_analyses` 테이블은 RLS가 활성화되어 있으며 브라우저 역할에 직접 접근 정책을 두지 않습니다. 데이터 접근은 인증된 백엔드 API를 통합니다.
- `.env*`, `env.production` 등 환경 파일은 저장소에 포함하지 않습니다.

## 검증

```bash
# Frontend 타입 검사
cd frontend && npx tsc --noEmit --incremental false

# Backend 테스트
cd backend && ./gradlew test
```

## 프로젝트 구조

```text
forward/
├── frontend/   # Next.js 웹 애플리케이션
└── backend/    # Spring Boot REST API 및 Flyway 마이그레이션
```

백엔드 계층과 API 규칙은 [Backend Architecture](backend/docs/architecture.md)에 정리되어 있습니다.
