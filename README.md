# Pilot Callcenter

AWS Connect 기반 콜센터 관리 플랫폼 (진행 중).

---

## 완료된 기능

### 인증 (Auth)
- [x] 회원가입 (`POST /api/auth/signup`) — 이메일/비밀번호/사용자명, 중복 이메일 검증
- [x] 이메일 중복 확인 (`GET /api/auth/check-email`)
- [x] 로그인 (`POST /api/auth/login`) — JWT access + refresh 토큰 발급
- [x] 토큰 갱신 (`POST /api/auth/refresh`) — Refresh Token Rotation
- [x] 로그아웃 (`POST /api/auth/logout`) — DB refresh token 삭제
- [x] 내 정보 조회 (`GET /api/auth/me`) — 인증 필요

### 상담 기록
- [x] 통화 시작 (`POST /api/calls/start`) — contactId(선택), fromNumber, toNumber
- [x] 통화 종료 (`PATCH /api/calls/{callSid}/end`) — durationSec
- [x] 상담 목록 조회 (`GET /api/calls`) — 최신순

### 프론트엔드
- [x] 회원가입 페이지 (`/register`) — react-hook-form + zod 유효성 검증
- [x] 로그인 페이지 (`/login`) — JWT 저장 (메모리 + localStorage)
- [x] 대시보드 페이지 (`/dashboard`) — 인증 가드, 사용자 정보 표시
- [x] 헤더 네비게이션 — 로그인 상태에 따른 UI 분기 (FSD 위젯)
- [x] axios 인터셉터 — 401 시 자동 토큰 갱신, 병렬 요청 큐잉
- [x] TanStack Store 기반 auth 상태 관리

### 공통
- [x] Swagger UI (`http://localhost:4101/swagger-ui/index.html`)
- [x] 통일된 에러 응답 형식 (`{code, message, timestamp, fieldErrors}`)
- [x] CORS 설정 (프론트 4100 ↔ 백엔드 4101)

---

## 포트 정보

| 서비스 | 포트 |
|--------|------|
| Frontend (Next.js) | 4100 |
| Backend (Spring Boot) | 4101 |
| PostgreSQL | 5434 |

---

## 개발 환경 세팅

### 필수 도구
- Java 21+
- Node.js 20+
- Docker Desktop

### 1. DB 실행 (Docker)

```bash
cd pilot-callcenter-container
docker compose up -d
```

PostgreSQL이 `localhost:5434`에서 기동됩니다.

### 2. 백엔드 실행

```bash
cd pilot-callcenter-server
./gradlew bootRun
```

`http://localhost:4101` 에서 기동. Swagger: `http://localhost:4101/swagger-ui/index.html`

### 3. 프론트엔드 실행

```bash
cd pilot-callcenter-front
npm install
npm run dev
```

`http://localhost:4100` 에서 기동.

---

## API — 상담 기록

로컬 개발 및 AWS Connect Lambda에서 호출하는 엔드포인트.

```
POST  /api/calls/start
      Body: { "contactId": "(선택)", "fromNumber": "010-xxxx-xxxx", "toNumber": "02-xxxx-xxxx" }

PATCH /api/calls/{callSid}/end
      Body: { "durationSec": 120 }

GET   /api/calls
```

AWS Connect 연동 시 Lambda에서 위 엔드포인트를 호출하도록 연결하면 됩니다.

---

## 에러 코드

| 코드 | HTTP | 의미 |
|------|------|------|
| AUTH_001 | 409 | 이메일 중복 |
| AUTH_002 | 404 | 사용자 없음 |
| AUTH_003 | 401 | 이메일/비밀번호 불일치 |
| AUTH_004 | 403 | 비활성 계정 |
| AUTH_005 | 401 | 유효하지 않은 토큰 |
| AUTH_006 | 401 | 유효하지 않은 리프레시 토큰 |
| COMMON_001 | 400 | 입력값 검증 실패 |
| COMMON_999 | 500 | 서버 오류 |
