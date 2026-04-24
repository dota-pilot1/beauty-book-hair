package com.cj.beautybook.schedule.presentation.dto;

import com.cj.beautybook.schedule.domain.BusinessHour;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record BusinessHourResponse(
        Long id,
        DayOfWeek dayOfWeek,
        LocalTime openTime,
        LocalTime closeTime,
        boolean closed
) {
    public static BusinessHourResponse from(BusinessHour businessHour) {
        return new BusinessHourResponse(
                businessHour.getId(),
                businessHour.getDayOfWeek(),
                businessHour.getOpenTime(),
                businessHour.getCloseTime(),
                businessHour.isClosed()
        );
    }
}
