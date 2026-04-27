package com.cj.beautybook.blog.presentation.dto;

import com.cj.beautybook.blog.domain.BlogPost;
import com.cj.beautybook.blog.domain.BlogPostStatus;

import java.time.Instant;
import java.util.List;

public record BlogPostDetailResponse(
        Long id,
        String slug,
        String title,
        String content,
        String summary,
        String coverImageUrl,
        Long authorStaffId,
        String authorName,
        BlogPostStatus status,
        boolean isPinned,
        int viewCount,
        List<BlogTagResponse> tags,
        Instant publishedAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static BlogPostDetailResponse from(BlogPost post) {
        List<BlogTagResponse> tags = post.getTags().stream()
                .map(BlogTagResponse::from)
                .toList();
        return new BlogPostDetailResponse(
                post.getId(),
                post.getSlug(),
                post.getTitle(),
                post.getContent(),
                post.getSummary(),
                post.getCoverImageUrl(),
                post.getAuthorStaffId(),
                post.getAuthorName(),
                post.getStatus(),
                post.isPinned(),
                post.getViewCount(),
                tags,
                post.getPublishedAt(),
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }
}
