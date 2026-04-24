package com.cj.beautybook.reservation.presentation.dto;

import com.cj.beautybook.staff.domain.Staff;

public record AvailableStaffResponse(
        Long id,
        String name
) {
    public static AvailableStaffResponse from(Staff staff) {
        return new AvailableStaffResponse(staff.getId(), staff.getName());
    }
}
