package com.cj.beautybook.blog.presentation.dto;

import com.cj.beautybook.blog.application.LexicalPreviewExtractor;
import com.cj.beautybook.blog.application.LexicalTextExtractor;
import com.cj.beautybook.blog.domain.BlogPost;
import com.cj.beautybook.blog.domain.BlogPostStatus;

import java.time.Instant;

public record BlogPostSummaryResponse(
        Long id,
        String slug,
        String title,
        String summary,
        String contentPreview,
        String previewJson,
        String coverImageUrl,
        String authorName,
        BlogPostStatus status,
        boolean isPinned,
        int viewCount,
        Instant publishedAt,
        Instant createdAt,
        BlogCategoryResponse category
) {
    public static BlogPostSummaryResponse from(BlogPost post) {
        return new BlogPostSummaryResponse(
                post.getId(),
                post.getSlug(),
                post.getTitle(),
                post.getSummary(),
                LexicalTextExtractor.extract(post.getContent()),
                LexicalPreviewExtractor.extract(post.getContent()),
                post.getCoverImageUrl(),
                post.getAuthorName(),
                post.getStatus(),
                post.isPinned(),
                post.getViewCount(),
                post.getPublishedAt(),
                post.getCreatedAt(),
                post.getCategory() != null ? BlogCategoryResponse.from(post.getCategory()) : null
        );
    }
}
