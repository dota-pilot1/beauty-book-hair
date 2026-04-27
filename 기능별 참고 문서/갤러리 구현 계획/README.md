# 미용 갤러리 구현 계획

## 개요

- 목적: 시술 전후 사진, 디자이너 포트폴리오를 이미지 중심으로 노출
- 기존 게시판(board)과 완전히 분리된 독립 모듈로 구현
- S3 presigned URL 인프라는 기존 `common/upload` 모듈 그대로 재사용

---

## 1. 백엔드 — `gallery` 도메인 모듈

### 패키지 구조

```
beauty-book-server/src/main/java/com/cj/beautybook/gallery/
├── domain/
│   ├── Gallery.java           # 메인 엔티티
│   └── GalleryTag.java        # ENUM (시술 종류)
├── application/
│   ├── GalleryService.java
│   └── dto/
│       ├── GalleryCreateRequest.java
│       ├── GalleryUpdateRequest.java
│       └── GalleryResponse.java
├── infrastructure/
│   └── GalleryRepository.java
└── presentation/
    └── GalleryController.java
```

### Gallery 엔티티 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| id | Long | PK |
| title | String(200) | 제목 (예: "내추럴 펌 before/after") |
| description | TEXT | 설명 (nullable) |
| imageUrl | String(500) | S3 public URL (메인 이미지) |
| beforeImageUrl | String(500) | before 이미지 (nullable) |
| designerId | Long | 담당 디자이너 staff.id (nullable) |
| designerName | String(100) | 비정규화 저장 |
| tag | GalleryTag ENUM | 스타일 분류 |
| isPublished | boolean | 노출 여부 (어드민 ON/OFF) |
| viewCount | int | 조회수 |
| createdAt | Instant | |
| updatedAt | Instant | |
| deletedAt | Instant | soft delete |

### GalleryTag ENUM

```java
CUT, PERM, COLOR, TREATMENT, SCALP, STYLING, ETC
```

> 한글 label은 프론트에서 매핑 (CUT → "커트", PERM → "펌", ...)

### API 설계

#### 어드민 API (인증 필요)

| Method | URL | 설명 |
|--------|-----|------|
| POST | `/api/gallery` | 갤러리 항목 등록 |
| PUT | `/api/gallery/{id}` | 수정 |
| DELETE | `/api/gallery/{id}` | soft delete |
| PATCH | `/api/gallery/{id}/publish` | 공개/비공개 토글 |
| GET | `/api/gallery/admin` | 전체 목록 (비공개 포함, 페이징) |

#### 공개 API (인증 불필요)

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/gallery` | 공개 목록 (페이징 + tag 필터 + designerId 필터) |
| GET | `/api/gallery/{id}` | 상세 (조회수 +1) |

#### 쿼리 파라미터 (공개 목록)

```
GET /api/gallery?tag=PERM&designerId=3&page=0&size=12&sort=createdAt,desc
```

---

## 2. 프론트엔드

### 페이지 구조

```
beauty-book--front/src/
├── app/
│   ├── gallery/
│   │   └── page.tsx                  # 고객용 갤러리 (공개)
│   └── admin/
│       └── gallery/
│           └── page.tsx              # 어드민 갤러리 관리
├── features/
│   └── gallery/
│       ├── GalleryGrid.tsx           # 마스너리/그리드 레이아웃
│       ├── GalleryFilterBar.tsx      # tag + 디자이너 필터
│       ├── GalleryCard.tsx           # 카드 컴포넌트
│       ├── GalleryDetailModal.tsx    # 상세 모달
│       ├── GalleryUploadForm.tsx     # 어드민 업로드 폼
│       └── GalleryAdminTable.tsx     # 어드민 목록 테이블
├── entities/
│   └── gallery/
│       ├── api/
│       │   └── galleryApi.ts
│       └── model/
│           └── types.ts
```

### 이미지 업로드 흐름

기존 `uploadImage(file, folder)` 함수 재사용 — `folder = "gallery"`로 호출

```typescript
const imageUrl = await uploadImage(file, "gallery");
// → S3 beauty-book-hair-front 버킷의 gallery/ 폴더에 저장
// → 반환된 publicUrl을 POST /api/gallery body에 포함
```

### 고객 갤러리 UX

- **기본 레이아웃**: 3열 그리드 (모바일 1열, 태블릿 2열)
- **필터**: tag 버튼 탭 (전체/커트/펌/컬러/트리트먼트...)
- **디자이너 필터**: 드롭다운 (선택적)
- **카드**: 이미지 + 제목 + 디자이너명 + tag 배지
- **클릭**: 상세 모달 (before/after 나란히 표시, 설명 텍스트)

### 어드민 갤러리 UX

- 목록 테이블: 썸네일 | 제목 | 태그 | 디자이너 | 공개여부 | 등록일 | 액션
- 등록 버튼 → 사이드 패널 또는 다이얼로그
  - 메인 이미지 업로드 (필수)
  - Before 이미지 업로드 (선택)
  - 제목, 설명, 태그 선택, 디자이너 연결
- 공개/비공개 토글 (테이블 인라인)

---

## 3. DB 마이그레이션

```sql
CREATE TABLE gallery (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(200)  NOT NULL,
    description     TEXT,
    image_url       VARCHAR(500)  NOT NULL,
    before_image_url VARCHAR(500),
    designer_id     BIGINT,
    designer_name   VARCHAR(100),
    tag             VARCHAR(30)   NOT NULL DEFAULT 'ETC',
    is_published    BOOLEAN       NOT NULL DEFAULT TRUE,
    view_count      INT           NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_gallery_tag       ON gallery(tag)        WHERE deleted_at IS NULL;
CREATE INDEX idx_gallery_designer  ON gallery(designer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_gallery_published ON gallery(is_published, created_at DESC) WHERE deleted_at IS NULL;
```

---

## 4. 구현 순서

```
Phase 1 — 백엔드 (1~2시간)
  ① Gallery 엔티티 + Repository
  ② GalleryService (CRUD + 조회수)
  ③ GalleryController (어드민 + 공개 API)
  ④ DB 스크립트 실행 (운영 서버)

Phase 2 — 프론트 어드민 (1시간)
  ⑤ galleryApi.ts 작성 (Tanstack Query)
  ⑥ GalleryUploadForm + GalleryAdminTable
  ⑦ /admin/gallery 페이지 연결

Phase 3 — 프론트 고객 페이지 (1시간)
  ⑧ GalleryCard + GalleryGrid + GalleryFilterBar
  ⑨ GalleryDetailModal (before/after)
  ⑩ /gallery 공개 페이지 연결

Phase 4 — 배포 및 확인
  ⑪ 백엔드 빌드 & 배포
  ⑫ 프론트 빌드 & S3 sync & CloudFront 무효화
  ⑬ 어드민에서 샘플 이미지 등록 후 고객 화면 확인
```

---

## 5. 참고 — 기존 재사용 코드

| 재사용 대상 | 경로 |
|-------------|------|
| S3 presign 업로드 | `common/upload/UploadService.java` |
| 프론트 이미지 업로드 | `shared/api/upload.ts` → `uploadImage(file, "gallery")` |
| DDD 모듈 패턴 | `board/` 패키지 구조 그대로 참고 |
| 어드민 레이아웃 | `app/admin/` 기존 페이지 구조 참고 |
| 페이지네이션 | 기존 board API 응답 타입 참고 |
