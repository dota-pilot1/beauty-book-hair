package com.cj.beautybook.reservation.presentation.dto;

import com.cj.beautybook.reservation.domain.Reservation;
import com.cj.beautybook.reservation.domain.ReservationStatus;

import java.time.Instant;

public record ReservationResponse(
        Long id,
        String customerName,
        String customerPhone,
        Long staffId,
        String staffName,
        Long beautyServiceId,
        String beautyServiceName,
        Instant startAt,
        Instant endAt,
        ReservationStatus status,
        String customerMemo,
        String adminMemo,
        Instant createdAt
) {
    public static ReservationResponse from(Reservation r) {
        return new ReservationResponse(
                r.getId(),
                r.getCustomerName(),
                r.getCustomerPhone(),
                r.getStaff().getId(),
                r.getStaff().getName(),
                r.getBeautyService().getId(),
                r.getBeautyService().getName(),
                r.getStartAt(),
                r.getEndAt(),
                r.getStatus(),
                r.getCustomerMemo(),
                r.getAdminMemo(),
                r.getCreatedAt()
        );
    }
}
