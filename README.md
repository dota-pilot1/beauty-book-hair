# BeautyBook — Auth Boilerplate

Next.js + Spring Boot 기반 **인증·인가 보일러플레이트**입니다.
JWT 인증, **RBAC (Role-Based Access Control)** 기반 역할·권한 관리, 역할-권한 매핑, 유저 역할 변경까지 관리자 기능을 제공합니다.

**설계 포인트**
- 백엔드: **DDD 4-Layer** 구조 (Presentation / Application / Domain / Infrastructure) × 바운디드 컨텍스트 분리
- 프론트: **FSD (Feature-Sliced Design)** 구조 (app / widgets / features / entities / shared)
- 영속성: **Spring Data JPA** — 도메인 엔티티(@Entity) + `JpaRepository` 인터페이스로 infrastructure 층에 격리
- 보안: Spring Security + JWT Access/Refresh Token + `@PreAuthorize` 기반 메서드 보안

## 기술 스택

| 영역 | 스택 |
| --- | --- |
| Frontend | Next.js 16, React 19, Tailwind v4, TanStack Query, react-hook-form + zod, i18next |
| Backend | Spring Boot, Spring Security, Spring Data JPA, JWT |
| DB | PostgreSQL 15 |
| Infra | Docker Compose |

## 아키텍처

### 백엔드 — DDD 4-Layer × 바운디드 컨텍스트

바운디드 컨텍스트(= 최상위 패키지) 단위로 독립적인 4계층 구조를 갖습니다.

```
com.cj.beautybook/
├── auth/                      # 인증 컨텍스트
│   ├── domain/                # RefreshToken (도메인 엔티티 @Entity)
│   ├── infrastructure/        # RefreshTokenRepository (JpaRepository)
│   ├── security/              # JwtAuthenticationFilter, UserPrincipal, CustomUserDetailsService
│   └── jwt/                   # JwtTokenProvider, JwtProperties, TokenType
├── user/                      # 유저 컨텍스트
│   ├── domain/ application/ infrastructure/ presentation/(+dto)
├── role/                      # 역할 컨텍스트
├── permission/                # 권한 컨텍스트
├── permission_category/       # 권한 카테고리 컨텍스트
├── menu/                      # 헤더 메뉴 컨텍스트 (DB 기반 N차 트리)
└── common/                    # 횡단 관심사 (response, exception)
```

| 계층 | 역할 | 예시 |
| --- | --- | --- |
| **presentation** | HTTP 진입점 + DTO | `RoleController`, `request/response DTO` |
| **application** | 유스케이스 / 트랜잭션 경계 | `RoleService` |
| **domain** | JPA 엔티티 · 도메인 규칙 | `Role`, `Permission`, `User` (`@Entity`) |
| **infrastructure** | 영속성 어댑터 | `RoleRepository extends JpaRepository<Role, Long>` |

- `presentation → application → domain` 은 하향 의존. `domain` 은 다른 계층을 모른다.
- `infrastructure` 는 `domain` 의 Repository 인터페이스를 구현 (Spring Data JPA 가 프록시 자동 생성).

### 프론트엔드 — FSD (Feature-Sliced Design)

```
beauty-book--front/src/
├── app/                       # Next.js App Router 라우트 + 전역 Provider
├── widgets/                   # 여러 feature 가 결합된 복합 UI (header)
├── features/                  # 단일 비즈니스 플로우
│   ├── auth/                  # login / signup 폼
│   ├── user-management/
│   ├── role-management/
│   └── permission-management/
├── entities/                  # 도메인 모델 + API + 모델 스토어
│   ├── user/                  # authStore, authApi, 타입
│   ├── permission/
│   └── permission-category/
└── shared/                    # 범용 UI · 유틸 · i18n · api client
    ├── ui/                    # FormField, PasswordInput, AuthLayout, ThemeSwitcher ...
    ├── lib/validation/        # zod 스키마
    ├── api/                   # axios instance, errors
    └── i18n/                  # i18next 설정 + 리소스
```

**의존 방향 규칙** (위 → 아래만 허용):
`app → widgets → features → entities → shared`

같은 계층 간 import 금지 — 복잡성 폭발을 구조적으로 차단합니다.

### RBAC 모델

```
User ──(N:1)── Role ──(N:M)── Permission ──(N:1)── PermissionCategory
```

- **User** 는 단일 `Role` 을 가집니다 (확장 시 N:M 으로 변경 가능).
- **Role** 과 **Permission** 은 N:M 매핑 (`role_permissions` 조인 테이블).
- **Permission** 은 카테고리로 묶어 UI 에서 체크박스 그룹으로 편집.
- 최초 가입자는 서버에서 강제로 `ROLE_ADMIN` 부여, 이후 가입자는 `ROLE_USER`.
- 인가 체크: API 는 Spring Security (`@PreAuthorize("hasRole('ADMIN')")`), 화면은 [RequireAuth](beauty-book--front/src/widgets/guards/RequireAuth.tsx) 가드.

## 주요 기능

- 이메일 회원가입 / 로그인 (JWT)
- 최초 가입자 자동 ROLE_ADMIN 부여
- 역할(Role) CRUD
- 권한(Permission) CRUD + 카테고리 분류
- 역할-권한 매핑 (체크박스 UI)
- 유저 역할 변경
- 관리자 전용 페이지 가드 (RequireAuth)
- **DB 기반 헤더 메뉴** — N차 트리, 관리자 CRUD UI (`/menu-management`), 드래그로 순서 변경, `requiredRole` 기반 가시성 필터 (상세: [docs-for-메뉴 데이터 디비 저장 and 헤더 메뉴 출력/](./docs-for-메뉴%20데이터%20디비%20저장%20and%20헤더%20메뉴%20출력/))
- **브랜드 컬러 테마 스위처** (6색 팔레트, 전체 surface 톤 전환, localStorage 지속)
- **다국어 (i18n)** — 한국어 / English / 日本語 / 中文, 헤더 드롭다운으로 실시간 전환

## UI 시스템

### 테마 시스템 ([src/app/globals.css](beauty-book--front/src/app/globals.css))

- shadcn 기본 토큰(`--primary`, `--card`, `--border` 등)을 유지한 채 `:root[data-theme="..."]` 로 덮어쓰는 구조
- 브랜드 팔레트: `rose` / `amber` / `mint` / `lavender` / `peach` / `sky` — 각 테마마다 surface 계열까지 낮은 채도로 틴트 적용
- 상태 저장: [themeStore.ts](beauty-book--front/src/shared/ui/theme/themeStore.ts) (`@tanstack/react-store` + localStorage)
- No-flash: `layout.tsx` `<head>` 인라인 스크립트가 hydration 전에 속성 적용
- UI: [ThemeSwitcher.tsx](beauty-book--front/src/shared/ui/theme/ThemeSwitcher.tsx) (헤더 우측)

테마 추가는 globals.css 에 `:root[data-theme="이름"]` 블록과 `.dark[data-theme="이름"]` 블록을 추가하고 `THEME_COLORS` 배열에 엔트리를 넣으면 끝.

## 다국어 (i18n)

`i18next` + `react-i18next` 기반. 구조는 [src/shared/i18n/](beauty-book--front/src/shared/i18n) 하위에 언어별·네임스페이스별 TS 파일로 관리.

```
src/shared/i18n/
├── index.ts                    # i18next 초기화, SUPPORTED_LANGUAGES 정의
├── I18nProvider.tsx            # "use client" 프로바이더
└── resources/
    ├── ko/{common,nav,auth,form,index}.ts
    ├── en/...
    ├── ja/...
    └── zh/...
```

- 기본 언어: `ko`, 폴백: `en`
- 언어 선택: [LanguageSelect.tsx](beauty-book--front/src/shared/ui/LanguageSelect.tsx) — 헤더 드롭다운
- 저장: `localStorage["app-language"]`
- 적용 범위 (1차): 헤더 네비게이션, 로그인 페이지, 대시보드 랜딩 (나머지 페이지는 점진 적용)

### 사용

```tsx
"use client";
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t } = useTranslation("nav");   // 네임스페이스 지정
  return <span>{t("dashboard")}</span>;  // 대시보드 / Dashboard / ダッシュボード / 仪表板
}
```

### 언어 추가

1. `src/shared/i18n/resources/<코드>/` 하위에 네임스페이스 TS 4개(common/nav/auth/form) + `index.ts` 작성
2. [index.ts](beauty-book--front/src/shared/i18n/index.ts) `resources` 와 `SUPPORTED_LANGUAGES` 에 등록

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
- `MenuSeeder` — 헤더 메뉴 기본 6개 (대시보드 + 관리 하위 4개)

## 가입 정책

- **첫 번째 가입자** → 서버에서 강제로 `ROLE_ADMIN` 부여
- **이후 가입자** → 기본 `ROLE_USER`

---

> 다음 단계 보강 아이디어 (이메일 인증, OAuth, Refresh Token, 2FA+Audit Log, E2E+CI 등) 는 [보일러 플레이트 강화 방법.md](./보일러%20플레이트%20강화%20방법.md) 참고.
