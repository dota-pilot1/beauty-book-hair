package com.cj.beautybook.schedule.presentation.dto;

import com.cj.beautybook.schedule.domain.StaffWorkingHour;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

public record StaffScheduleResponse(
        Long staffId,
        String staffName,
        String profileImageUrl,
        List<WorkingDay> workingDays
) {
    public record WorkingDay(
            DayOfWeek dayOfWeek,
            LocalTime startTime,
            LocalTime endTime,
            boolean working
    ) {
        public static WorkingDay from(StaffWorkingHour h) {
            return new WorkingDay(h.getDayOfWeek(), h.getStartTime(), h.getEndTime(), h.isWorking());
        }
    }
}
