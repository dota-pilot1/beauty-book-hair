# BeautyBook — 미용실 예약·운영 플랫폼

Next.js + Spring Boot 기반 **미용실 예약·운영 풀스택 플랫폼**입니다.
JWT 인증, RBAC 권한 관리, 예약 시스템, 게시판, 리치텍스트 에디터까지 실서비스 수준으로 구현되어 있습니다.

**운영 중**: [dxline-tallent.com](https://dxline-tallent.com) (CloudFront → S3 / EC2 백엔드)

---

## 기술 스택

| 영역 | 스택 |
|------|------|
| Frontend | Next.js 16 (App Router, SSG), React 19, Tailwind v4, TanStack Query, Zustand, Radix UI |
| Backend | Spring Boot 4.0.5, Spring Security, Spring Data JPA, JWT, Logback |
| DB | PostgreSQL 15 (Docker) |
| Editor | Lexical v0.43 (리치텍스트, 이미지 업로드·리사이즈·정렬) |
| Infra | AWS EC2 (t3.small, 서울), S3, CloudFront |

---

## 주요 기능

### 인증·인가
- 이메일 회원가입 / 로그인 (JWT Access + Refresh Token)
- **RBAC** — Role ↔ Permission N:M 매핑, 역할별 API·UI 가드
- 첫 번째 가입자 자동 `ROLE_ADMIN` 부여

### 예약 시스템
- 서비스 → 디자이너 → 날짜/시간 3단계 예약 플로우 (`/booking`)
- 30분 단위 슬롯, 예약 겹침·근무시간 체크, 휴무일 탐지
- 슬롯 상태: `AVAILABLE / REQUESTED / RESERVED / BLOCKED / PAST`
- 어드민 예약 현황·승인·취소·완료·노쇼·소프트딜리트
- 예약 차단 시간(BlockedTime) 관리 + 겹치는 예약 일괄 취소

### 직원·영업시간 관리
- 직원 CRUD, 담당 시술 설정, 요일별 근무시간 설정
- 영업시간 요일별 오픈/마감·휴무 관리 (`/schedule`)
- 고객 페이지 이번 주 스케줄 통합 테이블 (`/customer-space`)

### 게시판 시스템
- **게시판 설정(BoardConfig)** CRUD — code·kind·displayName·allowComment 등
- 게시판 생성 시 **헤더 메뉴 자동 연동** (BOARD 1차 + BOARD_CODE 2차 자동 추가/삭제)
- 게시글 CRUD (작성·수정·삭제·고정), 댓글 시스템 (작성·삭제·관리자 뱃지)
- **스플릿 뷰** — 왼쪽 목록(번호·제목·날짜 컬럼) / 오른쪽 상세+댓글
- **Lexical 리치텍스트 에디터** — Bold/Italic/Heading/List/Code/Image 툴바, 드래그앤드롭·붙여넣기 이미지 업로드 (`/api/upload/presign`)
- Breadcrumb 네비게이션, 엔터프라이즈 UI

### 헤더 메뉴
- **DB 기반 N차 트리** 메뉴, 관리자 CRUD UI (`/menu-management`)
- `requiredRole` 기반 가시성 필터 (비로그인·고객·관리자 구분)

### UI 시스템
- **브랜드 컬러 테마 스위처** — 6색 팔레트 (rose/amber/mint/lavender/peach/sky), localStorage 지속
- **다국어 (i18n)** — 한국어·English·日本語·中文 (i18next)
- AdminShell 사이드바 — 일자바 모드 + 정사각형 타일 morphing 애니메이션

---

## 아키텍처

### 백엔드 — DDD 4-Layer × 바운디드 컨텍스트

```
com.cj.beautybook/
├── auth/           # 인증 (JWT, RefreshToken)
├── user/           # 유저 관리
├── role/           # 역할
├── permission/     # 권한
├── menu/           # 헤더 메뉴 (N차 트리)
├── board/          # 게시판 (BoardConfig, Board, BoardComment)
├── reservation/    # 예약
├── schedule/       # 영업시간·차단시간
├── staff/          # 직원
└── common/         # 횡단 관심사 (response, exception)
```

각 컨텍스트는 `presentation / application / domain / infrastructure` 4계층.

### 프론트엔드 — FSD (Feature-Sliced Design)

```
beauty-book--front/src/
├── app/            # Next.js App Router 라우트 + 전역 Provider
├── widgets/        # 복합 UI (header, guards)
├── features/       # 단일 비즈니스 플로우 (auth, user-management 등)
├── entities/       # 도메인 모델 + API + TanStack Query hooks
│   ├── user/       # authStore, authApi
│   ├── board/      # boardApi, useBoards, types
│   └── ...
└── shared/
    ├── ui/
    │   ├── lexical/    # LexicalEditor, Toolbar, ImageNode, ImagePlugin
    │   ├── admin/      # AdminShell, AdminSidebar
    │   └── customer/   # CustomerShell
    ├── api/            # axios instance, upload (presign)
    └── i18n/           # i18next 설정 + 리소스
```

---

## 운영 환경

| 항목 | 값 |
|------|-----|
| 프론트 | `https://dxline-tallent.com` (CloudFront → S3 `beauty-book-hair-front`) |
| 백엔드 | `http://13.209.195.64:4101` (EC2 `ubuntu@13.209.195.64`, 탄력적 IP 고정) |
| DB | PostgreSQL Docker, 호스트 포트 `5434`, DB명 `beauty_book` |
| CloudFront 배포 ID | `E11NF3HMOB52NI` |

---

## 로컬 실행

### 1. DB (Docker)

```bash
docker compose up -d postgres
```

### 2. Backend

```bash
cd beauty-book-server
./gradlew bootRun
# API: http://localhost:4101
# Swagger: http://localhost:4101/swagger-ui/index.html
```

### 3. Frontend

```bash
cd beauty-book--front
npm install
npm run dev   # http://localhost:4100 (고객), http://localhost:3000 (Next.js 기본)
```

> 어드민 로컬: `localhost:4100` | `.env.production` 필수 (`NEXT_PUBLIC_API_BASE_URL=https://dxline-tallent.com`)

---

## 배포

### 백엔드

```bash
cd beauty-book-server && ./gradlew clean build -x test
scp -i "배포 가이드/hibot-d-server-key.pem" build/libs/beauty-book-server-0.0.1-SNAPSHOT.jar ubuntu@13.209.195.64:~/app.jar
ssh -i "배포 가이드/hibot-d-server-key.pem" ubuntu@13.209.195.64 \
  "lsof -ti:4101 | xargs kill -9 || true; sleep 2; set -a && source ~/.env && set +a; nohup java -jar app.jar --spring.profiles.active=prod > spring-boot.log 2>&1 &"
```

### 프론트엔드

```bash
cd beauty-book--front && npm run build
# ⚠️ --exclude "beauty-book/*" 필수 — 업로드 이미지 보존
aws s3 sync out/ s3://beauty-book-hair-front --delete --exclude "beauty-book/*"
aws cloudfront create-invalidation --distribution-id E11NF3HMOB52NI --paths "/*"
```

> 게시판 코드를 새로 추가했다면 재빌드 필수 (`generateStaticParams`가 빌드 시 `/api/boards/configs` 호출해 정적 페이지 생성)

---

## 초기 데이터 시딩

앱 시작 시 자동 실행:

- `PermissionCategorySeeder` — 기본 권한 카테고리
- `RoleSeeder` — ROLE_ADMIN / ROLE_MANAGER / ROLE_USER
- `PermissionSeeder` — 기본 권한 9종
- `MenuSeeder` — 헤더 메뉴 기본값

---

## 환경변수 설정

### 프론트엔드

`beauty-book--front/` 디렉터리에 아래 파일을 상황에 맞게 생성합니다. (`.gitignore` 대상 — 직접 생성 필요)

**`.env.local`** — 로컬 개발용

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4101
```

**`.env.production`** — 운영 빌드용 (`npm run build` 시 자동 적용)

```env
NEXT_PUBLIC_API_BASE_URL=https://dxline-tallent.com
```

> 운영 환경에서는 CloudFront가 `/api/*` 요청을 EC2 백엔드로 프록시합니다.  
> EC2를 직접 호출(`http://...`)하면 HTTPS 페이지에서 Mixed Content 차단이 발생하므로 반드시 CloudFront 도메인(`https://...`)을 사용해야 합니다.

---

### 백엔드

EC2 서버의 `~/.env` 파일에 환경변수를 저장하고, 서버 시작 시 `source ~/.env`로 주입합니다.

**`~/.env`** (EC2 서버 내)

```env
DB_URL=jdbc:postgresql://localhost:5434/beauty_book
DB_USERNAME=postgres
DB_PASSWORD=postgres

JWT_SECRET=<your-jwt-secret-256bit>
JWT_ACCESS_EXPIRATION=3600000
JWT_REFRESH_EXPIRATION=604800000

AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=beauty-book-hair-front
```

`application-prod.yaml`에서 `${ENV_VAR}` 형태로 참조하며, 배포 명령어 내 `set -a && source ~/.env && set +a`로 자동 로드됩니다.

---

## 상세 문서

- **프로젝트 컨셉 설명**: [`프로젝트 컨셉 설명/README.md`](./프로젝트%20컨셉%20설명/README.md) — 보일러플레이트 → 피처 자산 → 파일럿 3단 구조와 이 프로젝트의 위치
- 구현 현황 및 할일: `docs-for-현재 작업 내역/`
- 디버깅 히스토리: `개발 관리/디버깅 히스토리/`
- 배포 가이드: `배포 가이드/*.md` + `CLAUDE.md`
