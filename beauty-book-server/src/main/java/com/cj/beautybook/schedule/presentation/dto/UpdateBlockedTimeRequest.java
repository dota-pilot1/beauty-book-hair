package com.cj.beautybook.schedule.presentation.dto;

import com.cj.beautybook.schedule.domain.BlockedTimeType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record UpdateBlockedTimeRequest(
        Long staffId,

        @NotNull
        Instant startAt,

        @NotNull
        Instant endAt,

        @Size(max = 255)
        String reason,

        @NotNull
        BlockedTimeType blockType
) {
}
