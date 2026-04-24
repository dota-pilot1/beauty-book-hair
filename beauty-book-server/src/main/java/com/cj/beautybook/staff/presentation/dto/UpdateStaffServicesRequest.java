package com.cj.beautybook.staff.presentation.dto;

import jakarta.validation.constraints.NotNull;

import java.util.Set;

public record UpdateStaffServicesRequest(
        @NotNull
        Set<Long> beautyServiceIds
) {
}
