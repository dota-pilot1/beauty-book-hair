package com.cj.beautybook.schedule.presentation.dto;

import com.cj.beautybook.schedule.domain.StaffWorkingHour;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record StaffWorkingHourResponse(
        Long id,
        Long staffId,
        DayOfWeek dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        boolean working
) {
    public static StaffWorkingHourResponse from(StaffWorkingHour workingHour) {
        return new StaffWorkingHourResponse(
                workingHour.getId(),
                workingHour.getStaff().getId(),
                workingHour.getDayOfWeek(),
                workingHour.getStartTime(),
                workingHour.getEndTime(),
                workingHour.isWorking()
        );
    }
}
