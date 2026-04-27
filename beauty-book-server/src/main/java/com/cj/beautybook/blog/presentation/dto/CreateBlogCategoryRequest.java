package com.cj.beautybook.blog.presentation.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateBlogCategoryRequest(
        @NotBlank String name,
        @NotBlank String slug,
        int displayOrder
) {}
