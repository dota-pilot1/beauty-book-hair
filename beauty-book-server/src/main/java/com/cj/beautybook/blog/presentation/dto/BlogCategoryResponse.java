package com.cj.beautybook.blog.presentation.dto;

import com.cj.beautybook.blog.domain.BlogCategory;

public record BlogCategoryResponse(Long id, String name, String slug, int displayOrder) {
    public static BlogCategoryResponse from(BlogCategory c) {
        return new BlogCategoryResponse(c.getId(), c.getName(), c.getSlug(), c.getDisplayOrder());
    }
}
