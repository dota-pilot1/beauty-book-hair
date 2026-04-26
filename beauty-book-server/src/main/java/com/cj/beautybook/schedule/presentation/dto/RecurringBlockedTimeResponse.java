package com.cj.beautybook.schedule.presentation.dto;

import com.cj.beautybook.schedule.domain.BlockedTimeType;
import com.cj.beautybook.schedule.domain.RecurringBlockedTime;

import java.time.DayOfWeek;
import java.util.Set;

public record RecurringBlockedTimeResponse(
        Long id,
        Long staffId,
        Set<DayOfWeek> daysOfWeek,
        String startTime,
        String endTime,
        BlockedTimeType blockType,
        String reason,
        boolean active
) {
    public static RecurringBlockedTimeResponse from(RecurringBlockedTime r) {
        return new RecurringBlockedTimeResponse(
                r.getId(),
                r.getStaff() != null ? r.getStaff().getId() : null,
                r.parseDaysOfWeek(),
                r.getStartTime().toString(),
                r.getEndTime().toString(),
                r.getBlockType(),
                r.getReason(),
                r.isActive()
        );
    }
}
