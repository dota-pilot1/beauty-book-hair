package com.cj.beautybook.beauty_service.presentation.dto;

import com.cj.beautybook.beauty_service.domain.BeautyServiceCategory;

import java.time.Instant;

public record BeautyServiceCategoryResponse(
        Long id,
        String code,
        String name,
        String description,
        boolean visible,
        Integer displayOrder,
        Instant createdAt
) {
    public static BeautyServiceCategoryResponse from(BeautyServiceCategory category) {
        return new BeautyServiceCategoryResponse(
                category.getId(),
                category.getCode(),
                category.getName(),
                category.getDescription(),
                category.isVisible(),
                category.getDisplayOrder(),
                category.getCreatedAt()
        );
    }
}
