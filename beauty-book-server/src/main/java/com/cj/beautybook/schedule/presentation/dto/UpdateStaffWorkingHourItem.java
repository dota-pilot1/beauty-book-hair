package com.cj.beautybook.schedule.presentation.dto;

import jakarta.validation.constraints.NotNull;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record UpdateStaffWorkingHourItem(
        @NotNull
        DayOfWeek dayOfWeek,

        LocalTime startTime,

        LocalTime endTime,

        @NotNull
        Boolean working
) {
}
