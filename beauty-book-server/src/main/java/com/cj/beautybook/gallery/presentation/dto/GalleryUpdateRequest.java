package com.cj.beautybook.gallery.presentation.dto;

import com.cj.beautybook.gallery.domain.GalleryTag;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record GalleryUpdateRequest(
        @NotBlank String title,
        String description,
        @NotEmpty @Size(max = 10) List<String> imageUrls,
        String beforeImageUrl,
        Long designerId,
        String designerName,
        @NotNull GalleryTag tag,
        boolean isPublished
) {}
