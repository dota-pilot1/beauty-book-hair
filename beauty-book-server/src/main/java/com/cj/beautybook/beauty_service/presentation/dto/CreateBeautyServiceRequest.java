package com.cj.beautybook.beauty_service.presentation.dto;

import com.cj.beautybook.beauty_service.domain.BeautyServiceTargetGender;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

public record CreateBeautyServiceRequest(
        @NotBlank
        @Pattern(regexp = "^[A-Z][A-Z0-9_]*$", message = "대문자/숫자/언더스코어 형식이어야 합니다.")
        @Size(max = 80)
        String code,

        @NotBlank
        @Size(max = 120)
        String name,

        @NotNull
        Long categoryId,

        @Size(max = 500)
        String description,

        @NotNull
        @Min(5)
        @Max(1440)
        Integer durationMinutes,

        @NotNull
        @DecimalMin(value = "0.00")
        BigDecimal price,

        @NotNull
        BeautyServiceTargetGender targetGender,

        boolean visible,

        @NotNull
        @Min(0)
        Integer displayOrder,

        @Size(max = 10)
        List<@Size(max = 1000) String> imageUrls
) {}
