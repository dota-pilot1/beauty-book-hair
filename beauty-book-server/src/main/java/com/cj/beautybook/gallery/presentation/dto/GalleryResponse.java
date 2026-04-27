package com.cj.beautybook.gallery.presentation.dto;

import com.cj.beautybook.gallery.domain.Gallery;
import com.cj.beautybook.gallery.domain.GalleryPhotoType;
import com.cj.beautybook.gallery.domain.GalleryTag;

import java.time.Instant;
import java.util.List;

public record GalleryResponse(
        Long id,
        String title,
        String description,
        List<String> imageUrls,
        String beforeImageUrl,
        Long designerId,
        String designerName,
        GalleryTag tag,
        GalleryPhotoType photoType,
        boolean isPublished,
        int viewCount,
        Instant createdAt
) {
    public static GalleryResponse from(Gallery g) {
        return new GalleryResponse(
                g.getId(),
                g.getTitle(),
                g.getDescription(),
                List.copyOf(g.getImageUrls()),
                g.getBeforeImageUrl(),
                g.getDesignerId(),
                g.getDesignerName(),
                g.getTag(),
                g.getPhotoType(),
                g.isPublished(),
                g.getViewCount(),
                g.getCreatedAt()
        );
    }
}
