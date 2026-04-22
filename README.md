# BeautyBook — Auth Boilerplate

Next.js + Spring Boot 기반 인증·인가 보일러플레이트입니다.
회원가입·로그인·JWT 인증, 역할(Role) 관리, 권한(Permission) 관리, 역할-권한 매핑까지 갖춘 관리자 기능을 제공합니다.

## 기술 스택

| 영역 | 스택 |
| --- | --- |
| Frontend | Next.js 16, React 19, Tailwind v4, TanStack Query |
| Backend | Spring Boot, Spring Security, JWT |
| DB | PostgreSQL 15 |
| Infra | Docker Compose |

## 주요 기능

- 이메일 회원가입 / 로그인 (JWT)
- 최초 가입자 자동 ROLE_ADMIN 부여
- 역할(Role) CRUD
- 권한(Permission) CRUD + 카테고리 분류
- 역할-권한 매핑 (체크박스 UI)
- 유저 역할 변경
- 관리자 전용 페이지 가드 (RequireAuth)

## 실행

### 1. DB (Docker)

```bash
docker compose up -d postgres
```

| 항목 | 값 |
| --- | --- |
| Host | localhost |
| Port | 5434 |
| Database | beauty_book |
| Username | postgres |
| Password | postgres |

### 2. Backend

```bash
cd beauty-book-server
./gradlew bootRun
```

- API: `http://localhost:4101`
- Swagger: `http://localhost:4101/swagger-ui/index.html`

### 3. Frontend

```bash
cd beauty-book--front
npm install
npm run dev
```

- URL: `http://localhost:4100`

## 초기 데이터 시딩

앱 시작 시 아래 시더가 자동 실행됩니다.

- `PermissionCategorySeeder` — 기본 권한 카테고리
- `RoleSeeder` — ROLE_ADMIN / ROLE_MANAGER / ROLE_USER
- `PermissionSeeder` — 기본 권한 9종

## 가입 정책

- **첫 번째 가입자** → 서버에서 강제로 `ROLE_ADMIN` 부여
- **이후 가입자** → 기본 `ROLE_USER`
