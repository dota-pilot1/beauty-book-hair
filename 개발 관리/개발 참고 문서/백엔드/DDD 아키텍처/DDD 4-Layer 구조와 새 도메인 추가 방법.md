# 백엔드 DDD 4-Layer 아키텍처 — 구조와 새 도메인 추가 방법

> 이 프로젝트의 백엔드(Spring Boot)는 **바운디드 컨텍스트(도메인) 단위 패키징 × 4-Layer**를 기본 골격으로 둔다.
> 새 기능을 만들 때 어디에 무엇을 둘지, 그리고 어디까지가 "도메인"이고 어디부터가 "공통"인지 판단하는 기준을 정리한다.

---

## 1. 큰 그림

```
beauty-book-server/src/main/java/com/cj/beautybook/
├── auth/                  ← 인증 (특수 컨텍스트, 4-Layer 변형)
├── user/                  ← 도메인
├── role/                  ← 도메인
├── permission/            ← 도메인
├── permission_category/   ← 도메인
├── menu/                  ← 도메인
├── board/                 ← 도메인
├── reservation/           ← 도메인  ◀ 가장 잘 갖춰진 레퍼런스
├── schedule/              ← 도메인
├── staff/                 ← 도메인
├── beauty_service/        ← 도메인
├── site_settings/         ← 도메인
├── common/                ← 횡단 관심사 (response, exception, upload …)
└── config/                ← 전역 설정
```

원칙:

- **도메인 우선 패키징**: `controller/`, `service/`, `repository/`로 가로로 자르지 않고 **도메인으로 세로로** 자른다.
- **각 도메인 = 4-Layer**: `presentation / application / domain / infrastructure`
- **다른 도메인을 가로질러 import 해야 한다면 신호다** — 정말 의존이 맞는지, 아니면 `common`으로 올라가야 하는지를 점검.

---

## 2. 4-Layer 책임 분리

| 레이어 | 위치 | 책임 | 두지 말 것 |
|--------|------|------|----------|
| **presentation** | `xxx/presentation/` | HTTP 진입점 (Controller), 요청/응답 DTO, 권한(`@PreAuthorize`) | 비즈니스 규칙, JPA 엔티티 직접 노출 |
| **application** | `xxx/application/` | 유스케이스 오케스트레이션 (Service), 트랜잭션 경계 | HTTP/DTO 매핑, SQL/JPA Criteria |
| **domain** | `xxx/domain/` | JPA 엔티티, 값 객체, 도메인 enum, 도메인 규칙 메서드 | Spring 의존, Repository 인터페이스 외 인프라 |
| **infrastructure** | `xxx/infrastructure/` | `JpaRepository`, 외부 시스템 어댑터 (S3 등) | 비즈니스 로직 |

> 이 프로젝트는 도메인 모델 안에서 **JPA 엔티티 자체를 도메인 객체로 사용**한다. (헥사고날까지 가지 않는다 — 실용주의 DDD)

---

## 3. 대표 사례 — `reservation` 컨텍스트

가장 잘 갖춰진 레퍼런스. 새 도메인 만들 때 이걸 그대로 본떠라.

```
reservation/
├── presentation/
│   ├── ReservationController.java          ← 예약 CRUD/상태변경 엔드포인트
│   ├── ReservationSlotController.java      ← 슬롯 조회 전용 엔드포인트
│   └── dto/
│       ├── CreateReservationRequest.java
│       ├── ChangeReservationStatusRequest.java
│       ├── ReservationResponse.java
│       ├── ReservationItemResponse.java
│       ├── ReservationScheduleResponse.java
│       ├── ReservationSlotResponse.java
│       └── AvailableStaffResponse.java
├── application/
│   ├── ReservationService.java             ← 예약 생성/취소/완료/노쇼 유스케이스
│   ├── ReservationSlotService.java         ← 슬롯 계산 유스케이스 (영업시간/근무/겹침)
│   └── ReservationSlotStatus.java          ← 슬롯 상태 enum (애플리케이션 레벨)
├── domain/
│   ├── Reservation.java                    ← Aggregate Root
│   ├── ReservationItem.java                ← 자식 엔티티 (시술 묶음)
│   └── ReservationStatus.java              ← 도메인 enum (REQUESTED/RESERVED/…)
└── infrastructure/
    └── ReservationRepository.java          ← JpaRepository
```

### 어떤 결정을 내렸나

- **하나의 도메인에 컨트롤러가 둘**: 예약 CRUD와 슬롯 조회의 책임이 다르고 클라이언트도 다르게 호출 → 분리. **하나의 도메인 = 하나의 컨트롤러는 규칙이 아니다.**
- **`ReservationSlotStatus`가 application에 있는 이유**: DB에 저장되지 않고, 슬롯 계산 결과로만 만들어지는 "프레젠테이션에 가까운 상태" → domain이 아니라 application.
- **`ReservationStatus`는 domain에 있는 이유**: DB에 저장되는 진짜 도메인 상태. 라이프사이클(REQUESTED → RESERVED → COMPLETED 등)을 가짐.
- **DTO는 모두 presentation/dto 아래**: application 레이어가 DTO를 모르게 한다 → 다른 진입점(예: 배치, 스케줄러)이 생겨도 application을 재사용 가능.

---

## 4. 새 도메인 추가하는 절차 (체크리스트)

예시: "쿠폰(coupon)" 도메인을 새로 만든다고 가정.

### Step 1. 패키지 만들기
```
coupon/
├── presentation/
│   └── dto/
├── application/
├── domain/
└── infrastructure/
```

### Step 2. domain 먼저
- `Coupon.java` (Aggregate Root, JPA `@Entity`)
- 상태가 있다면 `CouponStatus.java` enum
- 도메인 규칙(예: `isExpired()`, `apply(amount)`)은 엔티티 메서드로

### Step 3. infrastructure
- `CouponRepository extends JpaRepository<Coupon, Long>`
- 커스텀 쿼리는 `@Query` 또는 `Specification`/`QueryDSL`로

### Step 4. application
- `CouponService` — 트랜잭션 경계(`@Transactional`)
- 유스케이스 단위로 메서드를 잘라라 (`issueCoupon`, `redeemCoupon`, `expireOldCoupons`)
- 여러 도메인을 조합해야 하면 application 레이어에서만 조합

### Step 5. presentation
- `CouponController` — `@RestController`, `@RequestMapping("/api/coupons")`
- 권한은 `@PreAuthorize("hasRole('ADMIN')")` 등으로 메서드 단위 부여
- DTO는 `presentation/dto/`에 record로

### Step 6. (선택) 시드 데이터
- 전역 초기 데이터가 필요하면 `config/` 또는 도메인별 `XxxSeeder`로 (`MenuSeeder`, `RoleSeeder` 참고)

### Step 7. 에러 코드 추가
- `common/exception/ErrorCode.java`에 `COUPON_NOT_FOUND` 등 추가
- 비즈니스 규칙 위반은 `BusinessException`으로 throw

---

## 5. 자주 헷갈리는 판단 기준

### Q. 다른 도메인의 엔티티를 직접 참조해도 되나?
- **읽기만 한다면**: `@ManyToOne`으로 다른 도메인 엔티티 참조 OK (예: `Reservation` → `Staff`)
- **쓰기를 한다면**: 상대 도메인의 application 서비스를 호출하라. 직접 `OtherRepository`를 의존하지 마라.

### Q. 두 도메인이 똑같은 로직을 쓴다. 어디로 빼나?
- 정말 도메인과 무관(예: 파일 업로드, ID 생성기, 이메일 발송)이면 → `common/`
- 도메인 의미가 있다면 → 새 도메인을 만들거나, 두 도메인을 묶는 **상위 컨텍스트**를 만들어라. 절대 한쪽 도메인에 우겨넣지 마라.

### Q. Service가 너무 커진다.
- 유스케이스 단위로 클래스를 쪼개라. `reservation`도 `ReservationService`와 `ReservationSlotService`로 쪼갰다.
- 한 Service에 모든 메서드를 모으는 건 도메인 패키징의 의미를 퇴색시킨다.

### Q. DTO를 application에서 반환해도 되나?
- 이 프로젝트는 **No**. application은 도메인 객체나 application 전용 결과 객체를 반환하고, presentation에서 DTO로 매핑한다.

---

## 6. 공통 규약

- **응답 포맷**: `common/response/`의 공통 응답 래퍼 사용 (성공/에러 일관)
- **에러 처리**: `common/exception/`의 `BusinessException` + `ErrorCode` enum + 글로벌 핸들러
  - 상세: [`docs-for-서버 공통 에러 처리/`](../../../../docs-for-서버%20공통%20에러%20처리)
- **인증/인가**: JWT는 `auth/jwt`, 권한 검사는 컨트롤러 메서드에 `@PreAuthorize`
- **트랜잭션**: application 서비스 메서드 단위 (`@Transactional` / `@Transactional(readOnly = true)`)

---

## 7. 새 도메인 추가 빠른 체크리스트

- [ ] 도메인 패키지 4개 하위 폴더 생성 (`presentation/dto`, `application`, `domain`, `infrastructure`)
- [ ] `domain/`에 엔티티 + enum + 도메인 메서드
- [ ] `infrastructure/`에 `JpaRepository`
- [ ] `application/`에 Service (유스케이스 단위 메서드, `@Transactional`)
- [ ] `presentation/`에 Controller + DTO record
- [ ] `common/exception/ErrorCode`에 도메인 에러 코드 추가
- [ ] `@PreAuthorize`로 권한 명시
- [ ] 다른 도메인 엔티티는 읽기만, 쓰기는 상대 Service 경유
- [ ] DTO는 presentation 밖으로 나가지 않게

---

## 8. 더 읽을거리 (이 프로젝트 내부)

- 대표 레퍼런스 코드: `beauty-book-server/src/main/java/com/cj/beautybook/reservation/`
- 공통 에러 처리: `docs-for-서버 공통 에러 처리/`
- 프로젝트 컨셉(왜 이렇게 자르는가): `프로젝트 컨셉 설명/README.md`
- 이미지 업로드(공통 기능 사용법): `개발 관리/개발 참고 문서/백엔드/이미지 업로드 구현/이미지 업로드 기능 구현시 참고 사항.md`
