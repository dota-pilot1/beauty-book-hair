package com.cj.beautybook.reservation.presentation.dto;

import com.cj.beautybook.reservation.domain.ReservationItem;

import java.math.BigDecimal;

public record ReservationItemResponse(
        Long id,
        Long beautyServiceId,
        String beautyServiceName,
        Integer durationMinutes,
        BigDecimal price,
        Integer displayOrder
) {
    public static ReservationItemResponse from(ReservationItem item) {
        return new ReservationItemResponse(
                item.getId(),
                item.getBeautyService().getId(),
                item.getBeautyServiceName(),
                item.getDurationMinutes(),
                item.getPrice(),
                item.getDisplayOrder()
        );
    }
}
