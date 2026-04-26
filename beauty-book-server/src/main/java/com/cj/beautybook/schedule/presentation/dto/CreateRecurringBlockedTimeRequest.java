package com.cj.beautybook.schedule.presentation.dto;

import com.cj.beautybook.schedule.domain.BlockedTimeType;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Set;

public record CreateRecurringBlockedTimeRequest(
        Long staffId,
        @NotEmpty Set<DayOfWeek> daysOfWeek,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        @NotNull BlockedTimeType blockType,
        @Size(max = 255) String reason
) {}
