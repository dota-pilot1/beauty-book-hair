package com.cj.beautybook.staff.presentation.dto;

import com.cj.beautybook.staff.domain.StaffRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateStaffRequest(
        @NotBlank
        @Size(max = 80)
        String name,

        @NotNull
        StaffRole role,

        @Size(max = 1000)
        String profileImageUrl,

        @Size(max = 500)
        String introduction,

        @NotNull
        Boolean active,

        @NotNull
        Integer displayOrder
) {
}
