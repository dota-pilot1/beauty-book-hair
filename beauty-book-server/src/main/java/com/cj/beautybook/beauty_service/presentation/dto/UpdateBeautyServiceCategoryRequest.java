package com.cj.beautybook.beauty_service.presentation.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateBeautyServiceCategoryRequest(
        @NotBlank
        @Size(max = 80)
        String name,

        @Size(max = 255)
        String description,

        boolean visible,

        @NotNull
        @Min(0)
        Integer displayOrder
) {}
