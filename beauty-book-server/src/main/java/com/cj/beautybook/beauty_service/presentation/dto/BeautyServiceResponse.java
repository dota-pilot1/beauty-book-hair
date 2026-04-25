package com.cj.beautybook.beauty_service.presentation.dto;

import com.cj.beautybook.beauty_service.domain.BeautyService;
import com.cj.beautybook.beauty_service.domain.BeautyServiceTargetGender;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record BeautyServiceResponse(
        Long id,
        String code,
        String name,
        BeautyServiceCategoryResponse category,
        String description,
        Integer durationMinutes,
        BigDecimal price,
        BeautyServiceTargetGender targetGender,
        boolean visible,
        Integer displayOrder,
        List<String> imageUrls,
        Instant createdAt,
        boolean hasActiveReservations
) {
    public static BeautyServiceResponse from(BeautyService service, boolean hasActiveReservations) {
        return new BeautyServiceResponse(
            service.getId(),
            service.getCode(),
            service.getName(),
            BeautyServiceCategoryResponse.from(service.getCategory()),
            service.getDescription(),
            service.getDurationMinutes(),
            service.getPrice(),
            service.getTargetGender(),
            service.isVisible(),
            service.getDisplayOrder(),
            service.getImageUrls(),
            service.getCreatedAt(),
            hasActiveReservations
        );
    }
}
