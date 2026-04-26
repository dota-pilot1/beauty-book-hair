package com.cj.beautybook.user.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileImageRequest(
        @NotBlank
        @Size(max = 500)
        String profileImageUrl
) {}
