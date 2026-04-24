package com.cj.beautybook.schedule.presentation.dto;

import com.cj.beautybook.schedule.domain.BlockedTime;
import com.cj.beautybook.schedule.domain.BlockedTimeType;

import java.time.Instant;

public record BlockedTimeResponse(
        Long id,
        Long staffId,
        Instant startAt,
        Instant endAt,
        String reason,
        BlockedTimeType blockType
) {
    public static BlockedTimeResponse from(BlockedTime blockedTime) {
        return new BlockedTimeResponse(
                blockedTime.getId(),
                blockedTime.getStaff() == null ? null : blockedTime.getStaff().getId(),
                blockedTime.getStartAt(),
                blockedTime.getEndAt(),
                blockedTime.getReason(),
                blockedTime.getBlockType()
        );
    }
}
