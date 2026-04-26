# 프론트엔드 FSD 아키텍처 — 구조와 새 기능 추가 방법

> 이 프로젝트의 프론트엔드(Next.js 16 App Router)는 **Feature-Sliced Design(FSD)** 기반 폴더 구조를 따른다.
> 새 화면/기능을 만들 때 어디에 무엇을 둘지, 그리고 의존 방향을 어떻게 지킬지를 정리한다.

---

## 1. 큰 그림

```
beauty-book--front/src/
├── app/         ← Next.js 라우트 + 전역 Provider (페이지 진입점)
├── widgets/     ← 여러 features/entities를 조립한 복합 UI 블록 (header, guards 등)
├── features/    ← "사용자가 한 번에 끝내는 행동" 단위 (auth, booking, user-management …)
├── entities/    ← 도메인 모델 + API 클라이언트 + TanStack Query hooks + 타입
└── shared/      ← 어디서든 쓰는 무도메인 자산 (ui kit, axios, i18n, lib, types)
```

**의존 방향 (절대 규칙)**:

```
app  →  widgets  →  features  →  entities  →  shared
                                            ↑
                                  (역방향 import 금지)
```

- 위 계층은 아래 계층을 import 가능
- 아래 계층은 위 계층을 절대 import 금지
- **같은 계층끼리도 가급적 import 금지** (특히 features ↔ features)
  - 두 feature가 서로 필요하면, 더 작은 단위로 entities/shared로 내려라

---

## 2. 각 레이어 책임

| 레이어 | 위치 | 책임 | 두지 말 것 |
|--------|------|------|----------|
| **app** | `src/app/` | Next.js 라우팅, 페이지 진입점, 전역 Provider | 비즈니스 로직, 재사용 컴포넌트 |
| **widgets** | `src/widgets/` | 헤더·사이드바·가드 등 **여러 기능을 조립한 UI 덩어리** | 페이지 단위 로직 (그건 app), 단일 기능 (그건 features) |
| **features** | `src/features/` | "예약하기", "로그인하기"처럼 **사용자 한 행동을 끝내는 UI + 상태** | 다른 feature import, 도메인 데이터 fetch 정의 자체 (그건 entities) |
| **entities** | `src/entities/` | **도메인 단위의 API + Query hooks + 타입** (예: 게시판, 예약) | 화면 UI, 폼, 모달 |
| **shared** | `src/shared/` | 도메인 무관 — axios, ui kit, i18n, 라우팅 헬퍼, lexical 에디터 | 도메인 지식 |

---

## 3. 대표 사례 ① — `entities/board` (도메인 데이터 레이어)

```
entities/board/
├── api/
│   └── boardApi.ts          ← axios 호출 + TanStack Query hooks (useBoards, useBoardConfigs …)
└── model/
    └── types.ts             ← Board, BoardConfig, BoardComment 타입
```

**이 레이어의 핵심 역할**:
- 백엔드 `/api/boards/*` 엔드포인트와 1:1로 매핑되는 호출 함수
- TanStack Query 키 규약 통일 (`['boards', code, page]`)
- 도메인 타입 single source of truth
- **여기는 UI를 모른다.** 어디서든 hook만 호출하면 데이터가 나온다.

---

## 4. 대표 사례 ② — `features/booking` (사용자 행동 단위)

```
features/booking/
└── model/                   ← 예약 플로우 상태 관리 (Zustand store, step 관리 등)
```

(추가로 화면 UI 컴포넌트를 같은 폴더에 둔다.)

**이 레이어의 핵심 역할**:
- "서비스 → 디자이너 → 날짜/시간"의 3단계 폼/state machine
- 여러 entities (`reservation`, `staff`, `beauty-service`, `schedule`)를 조합해 한 흐름을 완성
- entities의 hook을 가져다 쓰지만, **다른 feature(예: `auth`)를 import하지 않는다**

---

## 5. 대표 사례 ③ — `widgets/header`, `widgets/guards`

```
widgets/
├── header/
│   └── ui/                  ← 헤더 UI (DB 메뉴, 권한 필터링 메뉴 출력)
└── guards/                  ← AuthGuard, RoleGuard
```

- 헤더는 menu entity + user entity를 동시에 조합 → feature 한 개로 표현하기엔 광범위 → widget
- 가드는 여러 페이지가 공유하는 라우팅 보호 → widget

---

## 6. shared 레이어 — 도메인 없는 모든 것

```
shared/
├── api/                     ← axios 인스턴스, upload (presign)
├── i18n/resources/          ← ko/en/ja/zh 리소스
├── lib/
│   ├── routing/             ← 경로 헬퍼
│   └── validation/          ← zod 스키마 헬퍼
├── types/                   ← 전역 타입
└── ui/
    ├── admin/               ← AdminShell, AdminSidebar
    ├── customer/            ← CustomerShell
    ├── lexical/             ← Lexical 에디터 (노드/플러그인/툴바)
    └── theme/               ← 테마 토큰, 스위처
```

- 어떤 비즈니스 의미도 없어야 한다 — `Board`라는 단어가 여기 등장하면 잘못 둔 것.

---

## 7. 새 기능 추가하는 절차 (체크리스트)

예시: "쿠폰 관리(coupon-management)" 기능을 새로 만든다고 가정.

### Step 1. entities 먼저 만든다
```
entities/coupon/
├── api/
│   └── couponApi.ts         ← createCoupon / fetchCoupons / useCoupons …
└── model/
    └── types.ts             ← Coupon, CouponStatus
```

- 백엔드 엔드포인트와 1:1
- TanStack Query 키 일관: `['coupons']`, `['coupons', id]`

### Step 2. features 만든다
```
features/coupon-management/
├── CouponListTable.tsx
├── CouponFormDialog.tsx
└── model/
    └── useCouponForm.ts     ← (필요 시) 폼/플로우 상태
```

- entities/coupon의 hook을 호출
- 절대 다른 feature를 import 하지 마라
- 이미지가 들어간다면 `shared/api/upload.ts`의 `uploadImage(file, 'coupon')` 사용 ([이미지 업로드 참고 문서](../../백엔드/이미지%20업로드%20구현/이미지%20업로드%20기능%20구현시%20참고%20사항.md))

### Step 3. app 라우트
```
app/coupons/
└── page.tsx                 ← features/coupon-management의 컴포넌트 조립
```

- 페이지는 **얇게**: features를 import해서 배치만 한다
- 데이터 fetch도 직접 하지 말고 features 안의 hook이 처리

### Step 4. (필요 시) widgets
- 헤더 메뉴/사이드바에 노출 필요하면 widget 갱신
- 메뉴는 DB 기반이라 `/menu-management`에서 추가만 해도 됨

### Step 5. (필요 시) shared
- 새로 발견한 무도메인 헬퍼만 여기에. 도메인 타입을 절대 두지 마라.

---

## 8. 자주 헷갈리는 판단 기준

### Q. 두 feature가 같은 컴포넌트를 쓴다.
- 도메인 의미가 없는 UI 부품(예: SortableList) → `shared/ui`로
- 도메인 의미가 있다면(예: CouponBadge) → `entities/coupon`에 두고 두 feature가 각자 import

### Q. feature 안에서 다른 feature의 함수가 필요하다.
- **냄새다.** 진짜 필요하면 두 기능을 묶는 widget을 만들거나, 공통 부분을 entities/shared로 내려라.

### Q. entities에 React 컴포넌트를 둬도 되나?
- **표시용 atomic 컴포넌트**(예: `<UserAvatar user={...} />`)는 OK
- 폼/모달/테이블 같은 화면 단위는 features로

### Q. app/ 안에 컴포넌트를 만들어도 되나?
- 그 페이지에서만 쓰는 것이라도 가능하면 features로 빼라
- 다음에 다른 페이지가 같은 걸 원할 확률이 항상 있다

### Q. TanStack Query 키 규약은?
- `[도메인이름(복수), …식별자]` — 예: `['boards']`, `['boards', code, page]`, `['reservations', userId]`
- entities/api/*Api.ts에서만 정의하고, features는 호출만

---

## 9. App Router(SSG)와 FSD의 만남

이 프로젝트는 Next.js 16 App Router + **SSG(`output: 'export'`)** 로 빌드 → S3 배포.

- `app/[code]/page.tsx`처럼 동적 라우트는 `generateStaticParams`로 빌드 타임에 정적 생성
- 그래서 **새 게시판 코드를 추가했다면 프론트 재빌드 필수** (`generateStaticParams`가 빌드 시점에만 호출됨)
- 이 제약은 entities/api 호출이 빌드 타임에도 가능하도록 axios 베이스 URL이 환경변수로 분리된 이유

---

## 10. 새 기능 추가 빠른 체크리스트

- [ ] `entities/{domain}/api`에 axios 호출 + Query hook + 키 규약 정리
- [ ] `entities/{domain}/model`에 도메인 타입
- [ ] `features/{action}`에 화면 컴포넌트 + (필요 시) 폼/플로우 상태
- [ ] `app/{route}/page.tsx`는 얇게 — features만 조립
- [ ] 이미지가 있으면 `shared/api/upload`의 `uploadImage(file, '도메인폴더')` 호출
- [ ] 메뉴 노출 필요 시 `/menu-management`에서 메뉴 등록 (DB 기반이라 코드 수정 불필요)
- [ ] features → features import 없는지 확인
- [ ] entities/widgets에서 React 페이지 단위 로직이 새지 않았는지 확인
- [ ] 동적 라우트 페이지면 `generateStaticParams` 추가 + 재빌드

---

## 11. 더 읽을거리 (이 프로젝트 내부)

- 대표 entities: `beauty-book--front/src/entities/board/`, `entities/reservation/`
- 대표 features: `features/booking/`, `features/user-management/`
- 대표 widgets: `widgets/header/`, `widgets/guards/`
- 공통 UI/에디터: `shared/ui/lexical/`, `shared/ui/admin/`
- 이미지 업로드 공통 기능: [`백엔드/이미지 업로드 구현/이미지 업로드 기능 구현시 참고 사항.md`](../../백엔드/이미지%20업로드%20구현/이미지%20업로드%20기능%20구현시%20참고%20사항.md)
- 프로젝트 컨셉(왜 이렇게 자르는가): `프로젝트 컨셉 설명/README.md`
