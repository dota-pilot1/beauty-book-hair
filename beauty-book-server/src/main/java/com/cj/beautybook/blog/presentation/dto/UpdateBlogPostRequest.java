package com.cj.beautybook.blog.presentation.dto;

import com.cj.beautybook.blog.domain.BlogPostStatus;

import java.util.List;

public record UpdateBlogPostRequest(
        String title,
        String content,
        String summary,
        String coverImageUrl,
        Long authorStaffId,
        String authorName,
        BlogPostStatus status,
        Boolean isPinned,
        List<Long> tagIds
) {}
