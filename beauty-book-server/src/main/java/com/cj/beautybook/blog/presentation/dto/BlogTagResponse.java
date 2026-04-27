package com.cj.beautybook.blog.presentation.dto;

import com.cj.beautybook.blog.domain.BlogTag;

public record BlogTagResponse(Long id, String name, String slug) {
    public static BlogTagResponse from(BlogTag tag) {
        return new BlogTagResponse(tag.getId(), tag.getName(), tag.getSlug());
    }
}
