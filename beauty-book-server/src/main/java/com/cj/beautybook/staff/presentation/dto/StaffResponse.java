package com.cj.beautybook.staff.presentation.dto;

import com.cj.beautybook.staff.domain.Staff;
import com.cj.beautybook.staff.domain.StaffRole;

import java.time.Instant;

public record StaffResponse(
        Long id,
        String name,
        StaffRole role,
        String profileImageUrl,
        String introduction,
        boolean active,
        Integer displayOrder,
        Instant createdAt
) {
    public static StaffResponse from(Staff staff) {
        return new StaffResponse(
                staff.getId(),
                staff.getName(),
                staff.getRole(),
                staff.getProfileImageUrl(),
                staff.getIntroduction(),
                staff.isActive(),
                staff.getDisplayOrder(),
                staff.getCreatedAt()
        );
    }
}
