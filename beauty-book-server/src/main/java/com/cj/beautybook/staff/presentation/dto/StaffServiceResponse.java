package com.cj.beautybook.staff.presentation.dto;

import com.cj.beautybook.staff.domain.StaffService;

public record StaffServiceResponse(
        Long id,
        Long staffId,
        Long beautyServiceId,
        String beautyServiceName,
        boolean active
) {
    public static StaffServiceResponse from(StaffService staffService) {
        return new StaffServiceResponse(
                staffService.getId(),
                staffService.getStaff().getId(),
                staffService.getBeautyService().getId(),
                staffService.getBeautyService().getName(),
                staffService.isActive()
        );
    }
}
