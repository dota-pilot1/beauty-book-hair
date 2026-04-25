package com.cj.beautybook.reservation.presentation.dto;

import com.cj.beautybook.reservation.domain.Reservation;
import com.cj.beautybook.reservation.domain.ReservationStatus;

import java.time.Instant;
import java.util.List;

/**
 * 인증된 모든 사용자에게 노출되는 예약 일정. 고객 PII(이름/전화번호)는 포함하지 않는다.
 * 시간대 점유 현황과 디자이너/시술 정보만 노출한다.
 */
public record ReservationScheduleResponse(
        Long id,
        Long staffId,
        String staffName,
        Long beautyServiceId,
        String beautyServiceName,
        List<ReservationScheduleItemResponse> items,
        Instant startAt,
        Instant endAt,
        ReservationStatus status
) {
    public static ReservationScheduleResponse from(Reservation r) {
        List<ReservationScheduleItemResponse> itemResponses = r.getItems().isEmpty()
                ? List.of(new ReservationScheduleItemResponse(
                        r.getBeautyService().getId(),
                        r.getBeautyService().getName(),
                        r.getBeautyService().getDurationMinutes(),
                        0
                ))
                : r.getItems().stream()
                        .map(item -> new ReservationScheduleItemResponse(
                                item.getBeautyService().getId(),
                                item.getBeautyServiceName(),
                                item.getDurationMinutes(),
                                item.getDisplayOrder()
                        ))
                        .toList();
        return new ReservationScheduleResponse(
                r.getId(),
                r.getStaff().getId(),
                r.getStaff().getName(),
                r.getBeautyService().getId(),
                r.getBeautyService().getName(),
                itemResponses,
                r.getStartAt(),
                r.getEndAt(),
                r.getStatus()
        );
    }

    public record ReservationScheduleItemResponse(
            Long beautyServiceId,
            String beautyServiceName,
            Integer durationMinutes,
            Integer displayOrder
    ) {}
}
