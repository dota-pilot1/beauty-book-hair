# 06. 백엔드 API 명세

## 공개 API

고객 화면에서 사용한다.

### 시술 가능 디자이너 조회

```http
GET /api/designers?beautyServiceId=10
```

응답:

```json
[
  {
    "id": 1,
    "name": "수아 디자이너",
    "profileImageUrl": "https://example.com/designers/sua.jpg",
    "introduction": "레이어드 컷과 자연스러운 펌을 잘합니다."
  }
]
```

### 예약 슬롯 조회

```http
GET /api/reservation-slots?beautyServiceId=10&date=2026-04-29
```

`designerId`는 optional 필터다.

```http
GET /api/reservation-slots?beautyServiceId=10&date=2026-04-29&designerId=1
```

응답:

```json
[
  {
    "slotId": "2026-04-29T10:30:00",
    "startAt": "2026-04-29T10:30:00",
    "endAt": "2026-04-29T11:30:00",
    "durationMinutes": 60,
    "unitMinutes": 30,
    "occupiedUnitCount": 2,
    "status": "AVAILABLE",
    "selectable": true,
    "availableDesigners": [
      {
        "id": 1,
        "name": "하린"
      },
      {
        "id": 2,
        "name": "민서"
      }
    ],
    "reason": "예약 요청 가능"
  },
  {
    "slotId": "2026-04-29T16:30:00",
    "startAt": "2026-04-29T16:30:00",
    "endAt": "2026-04-29T17:30:00",
    "durationMinutes": 60,
    "unitMinutes": 30,
    "occupiedUnitCount": 2,
    "status": "RESERVED",
    "selectable": false,
    "availableDesigners": [],
    "reason": "가능한 디자이너가 없습니다."
  }
]
```

여러 날짜를 한 번에 보여주는 오른쪽 패널이 필요하면 확장 API를 추가한다.

```http
GET /api/reservation-slot-days?beautyServiceId=10&fromDate=2026-04-29&days=14
```

응답:

```json
[
  {
    "date": "2026-04-29",
    "slots": []
  }
]
```

### 예약 요청 생성

```http
POST /api/reservations
```

요청:

```json
{
  "beautyServiceId": 10,
  "designerId": 1,
  "startAt": "2026-04-29T10:30:00",
  "customerName": "오현석",
  "customerPhone": "010-0000-0000",
  "customerMemo": "앞머리 상담도 같이 부탁드립니다."
}
```

응답:

```json
{
  "id": 100,
  "status": "REQUESTED",
  "startAt": "2026-04-29T10:30:00",
  "endAt": "2026-04-29T11:30:00"
}
```

### 내 예약 조회

초기에는 로그인 연동 전이므로 전화번호 기준 조회를 허용할 수 있다.

```http
GET /api/reservations/my?phone=010-0000-0000
```

## 관리자 API

### 예약 목록

```http
GET /api/admin/reservations?date=2026-04-29&status=REQUESTED
```

### 예약 상태 변경

```http
PATCH /api/admin/reservations/{reservationId}/status
```

요청:

```json
{
  "status": "CONFIRMED",
  "adminMemo": "확정 안내 완료"
}
```

### 영업시간 관리

```http
GET /api/admin/schedules/business-hours
PUT /api/admin/schedules/business-hours
```

### 디자이너 근무시간 관리

```http
GET /api/admin/schedules/designers/{designerId}/working-hours
PUT /api/admin/schedules/designers/{designerId}/working-hours
```

### 예약 불가 시간 관리

```http
GET /api/admin/schedules/blocked-times?designerId=1&date=2026-04-29
POST /api/admin/schedules/blocked-times
PATCH /api/admin/schedules/blocked-times/{blockedTimeId}
DELETE /api/admin/schedules/blocked-times/{blockedTimeId}
```

### 디자이너 관리

```http
GET /api/admin/designers
POST /api/admin/designers
PATCH /api/admin/designers/{designerId}
GET /api/admin/designers/{designerId}/services
PUT /api/admin/designers/{designerId}/services
```

## 에러 코드

추가 권장:

- SCHEDULE_NOT_FOUND
- INVALID_TIME_RANGE
- RESERVATION_SLOT_UNAVAILABLE
- RESERVATION_CONFLICT
- RESERVATION_NOT_FOUND
- INVALID_RESERVATION_STATUS
- DESIGNER_NOT_FOUND
- DESIGNER_SERVICE_NOT_ALLOWED
