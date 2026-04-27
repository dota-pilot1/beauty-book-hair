package com.cj.beautybook.blog.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateBlogCategoryRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 100) String slug,
        int displayOrder
) {}
