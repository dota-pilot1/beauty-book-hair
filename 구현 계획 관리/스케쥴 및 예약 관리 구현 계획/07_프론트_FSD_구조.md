# 07. 프론트 FSD 구조

## 목표

스케쥴과 예약 API를 고객 화면과 관리자 화면에서 재사용할 수 있게 FSD 기준으로 나눈다.

## entities

```text
src/entities/schedule/
├── api/scheduleApi.ts
├── model/types.ts
├── model/useReservationSlots.ts
├── model/useBusinessHours.ts
├── model/useDesignerWorkingHours.ts
└── model/useBlockedTimes.ts

src/entities/reservation/
├── api/reservationApi.ts
├── model/types.ts
├── model/useReservations.ts
├── model/useCreateReservation.ts
└── model/useUpdateReservationStatus.ts

src/entities/designer/
├── api/designerApi.ts
├── model/types.ts
└── model/useDesignersByService.ts
```

## features

```text
src/features/schedule-management/
├── BusinessHoursEditor.tsx
├── DesignerWorkingHoursEditor.tsx
├── BlockedTimeDialog.tsx
└── BlockedTimeList.tsx

src/features/reservation-management/
├── ReservationStatusBadge.tsx
├── ReservationStatusActions.tsx
├── ReservationTable.tsx
└── ReservationDetailDialog.tsx
```

## pages

```text
src/app/booking/page.tsx
src/app/my-reservations/page.tsx
src/app/schedules/page.tsx
src/app/reservations/page.tsx
```

## 원칙

- `booking/page.tsx` 안에 API 호출을 직접 많이 넣지 않는다.
- 목록 조회 훅은 entities에 둔다.
- 상태 변경 UI는 features에 둔다.
- 페이지는 조립과 라우팅 책임만 가진다.

## 우선 만들 훅

1. useReservationSlots
2. useDesignersByService
3. useCreateReservation
4. useReservations
5. useUpdateReservationStatus
6. useBusinessHours
7. useDesignerWorkingHours
8. useBlockedTimes
