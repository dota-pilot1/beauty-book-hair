package com.cj.beautybook.reservation.presentation.dto;

import com.cj.beautybook.reservation.domain.Reservation;
import com.cj.beautybook.reservation.domain.ReservationStatus;

import java.time.Instant;
import java.util.List;

public record ReservationResponse(
        Long id,
        String customerName,
        String customerPhone,
        Long staffId,
        String staffName,
        Long beautyServiceId,
        String beautyServiceName,
        List<ReservationItemResponse> items,
        Instant startAt,
        Instant endAt,
        ReservationStatus status,
        String customerMemo,
        String adminMemo,
        Instant createdAt
) {
    public static ReservationResponse from(Reservation r) {
        List<ReservationItemResponse> itemResponses = r.getItems().isEmpty()
                ? List.of(new ReservationItemResponse(
                        null,
                        r.getBeautyService().getId(),
                        r.getBeautyService().getName(),
                        r.getBeautyService().getDurationMinutes(),
                        r.getBeautyService().getPrice(),
                        0
                ))
                : r.getItems().stream().map(ReservationItemResponse::from).toList();
        return new ReservationResponse(
                r.getId(),
                r.getCustomerName(),
                r.getCustomerPhone(),
                r.getStaff().getId(),
                r.getStaff().getName(),
                r.getBeautyService().getId(),
                r.getBeautyService().getName(),
                itemResponses,
                r.getStartAt(),
                r.getEndAt(),
                r.getStatus(),
                r.getCustomerMemo(),
                r.getAdminMemo(),
                r.getCreatedAt()
        );
    }
}
