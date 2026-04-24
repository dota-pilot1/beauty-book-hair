package com.cj.beautybook.schedule.presentation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record UpdateStaffWorkingHoursRequest(
        @NotEmpty
        List<@Valid UpdateStaffWorkingHourItem> workingHours
) {
}
