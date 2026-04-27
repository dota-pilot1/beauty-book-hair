package com.cj.beautybook.blog.presentation.dto;

import com.cj.beautybook.blog.domain.BlogPostStatus;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record CreateBlogPostRequest(
        @NotBlank String title,
        @NotBlank String slug,
        String content,
        String summary,
        String coverImageUrl,
        Long authorStaffId,
        String authorName,
        BlogPostStatus status,
        boolean isPinned,
        Long categoryId,
        List<Long> tagIds
) {}
