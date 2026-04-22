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

## 가입 정책

- **첫 번째 가입자** → 서버에서 강제로 `ROLE_ADMIN` 부여
- **이후 가입자** → 기본 `ROLE_USER`

---

> 다음 단계 보강 아이디어 (이메일 인증, OAuth, Refresh Token, 2FA+Audit Log, E2E+CI 등) 는 [보일러 플레이트 강화 방법.md](./보일러%20플레이트%20강화%20방법.md) 참고.
