# beauty-book--front

Next.js 16 (App Router, SSG) + React 19 + Tailwind v4 기반 프론트엔드.

## 로컬 실행

```bash
npm install
npm run dev   # http://localhost:4100
```

## 빌드 & 배포

```bash
# .env.production 필수
# NEXT_PUBLIC_API_BASE_URL=https://dxline-tallent.com

npm run build
aws s3 sync out/ s3://beauty-book-hair-front --delete --exclude "beauty-book/*"
aws cloudfront create-invalidation --distribution-id E11NF3HMOB52NI --paths "/*"
```

> 게시판 코드를 새로 추가했을 경우 반드시 재빌드 (`generateStaticParams`가 빌드 시 API 호출해 정적 페이지 생성)

## 환경변수

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_API_BASE_URL` | 백엔드 API base URL (기본 `http://localhost:4101`) |

## 포트

| 서비스 | 포트 |
|--------|------|
| Frontend (Next.js) | 4100 |
| Backend (Spring Boot) | 4101 |
| Postgres (host) | 5434 |

## 주요 구조

```
src/
├── app/                  # App Router 라우트
│   ├── boards/[code]/    # 게시판 (스플릿 뷰)
│   ├── booking/          # 예약 플로우
│   ├── board-management/ # 게시판 설정 관리 (어드민)
│   ├── schedule/         # 영업시간·차단시간 (어드민)
│   └── ...
├── entities/
│   ├── board/            # boardApi, useBoards hooks, types
│   ├── user/             # authStore, authApi
│   └── ...
└── shared/
    ├── ui/
    │   ├── lexical/      # Lexical 리치텍스트 에디터
    │   ├── admin/        # AdminShell, AdminSidebar
    │   └── customer/     # CustomerShell
    └── api/              # axios instance, upload presign
```
