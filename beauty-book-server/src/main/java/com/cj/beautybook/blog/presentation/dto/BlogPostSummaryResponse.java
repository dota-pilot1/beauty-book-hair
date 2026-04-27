package com.cj.beautybook.blog.presentation.dto;

import com.cj.beautybook.blog.domain.BlogPost;
import com.cj.beautybook.blog.domain.BlogPostStatus;

import java.time.Instant;

public record BlogPostSummaryResponse(
        Long id,
        String slug,
        String title,
        String summary,
        String coverImageUrl,
        String authorName,
        BlogPostStatus status,
        boolean isPinned,
        int viewCount,
        Instant publishedAt,
        Instant createdAt
) {
    public static BlogPostSummaryResponse from(BlogPost post) {
        return new BlogPostSummaryResponse(
                post.getId(),
                post.getSlug(),
                post.getTitle(),
                post.getSummary(),
                post.getCoverImageUrl(),
                post.getAuthorName(),
                post.getStatus(),
                post.isPinned(),
                post.getViewCount(),
                post.getPublishedAt(),
                post.getCreatedAt()
        );
    }
}
