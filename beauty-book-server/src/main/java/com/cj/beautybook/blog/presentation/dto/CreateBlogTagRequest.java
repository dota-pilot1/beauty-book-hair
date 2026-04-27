package com.cj.beautybook.blog.presentation.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateBlogTagRequest(
        @NotBlank String name,
        @NotBlank String slug
) {}
