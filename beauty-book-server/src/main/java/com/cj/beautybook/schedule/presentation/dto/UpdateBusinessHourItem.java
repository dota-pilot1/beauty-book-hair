package com.cj.beautybook.schedule.presentation.dto;

import jakarta.validation.constraints.NotNull;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record UpdateBusinessHourItem(
        @NotNull
        DayOfWeek dayOfWeek,

        LocalTime openTime,

        LocalTime closeTime,

        @NotNull
        Boolean closed
) {
}
