package com.cj.beautybook.gallery.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@SQLRestriction("deleted_at IS NULL")
@Table(name = "gallery")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Gallery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "gallery_images",
            joinColumns = @JoinColumn(name = "gallery_id")
    )
    @OrderColumn(name = "display_order")
    @Column(name = "image_url", nullable = false, length = 500)
    private List<String> imageUrls = new ArrayList<>();

    @Column(length = 500)
    private String beforeImageUrl;

    @Column
    private Long designerId;

    @Column(length = 100)
    private String designerName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private GalleryTag tag = GalleryTag.ETC;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private GalleryPhotoType photoType = GalleryPhotoType.BA;

    @Column(nullable = false)
    private boolean isPublished = true;

    @Column(nullable = false)
    private int viewCount = 0;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    @Column
    private Instant deletedAt;

    public static Gallery create(
            String title,
            String description,
            List<String> imageUrls,
            String beforeImageUrl,
            Long designerId,
            String designerName,
            GalleryTag tag,
            GalleryPhotoType photoType,
            boolean isPublished
    ) {
        Gallery g = new Gallery();
        g.title = title;
        g.description = description;
        g.replaceImageUrls(imageUrls);
        g.beforeImageUrl = beforeImageUrl;
        g.designerId = designerId;
        g.designerName = designerName;
        g.tag = tag != null ? tag : GalleryTag.ETC;
        g.photoType = photoType != null ? photoType : GalleryPhotoType.BA;
        g.isPublished = isPublished;
        g.viewCount = 0;
        return g;
    }

    public void update(
            String title,
            String description,
            List<String> imageUrls,
            String beforeImageUrl,
            Long designerId,
            String designerName,
            GalleryTag tag,
            GalleryPhotoType photoType,
            boolean isPublished
    ) {
        this.title = title;
        this.description = description;
        replaceImageUrls(imageUrls);
        this.beforeImageUrl = beforeImageUrl;
        this.designerId = designerId;
        this.designerName = designerName;
        this.tag = tag != null ? tag : GalleryTag.ETC;
        this.photoType = photoType != null ? photoType : GalleryPhotoType.BA;
        this.isPublished = isPublished;
    }

    private void replaceImageUrls(List<String> next) {
        List<String> filtered = next == null ? List.of() : next.stream()
                .filter(url -> url != null && !url.isBlank())
                .toList();
        this.imageUrls.clear();
        this.imageUrls.addAll(filtered);
    }

    public void togglePublish() {
        this.isPublished = !this.isPublished;
    }

    public void incrementView() {
        this.viewCount++;
    }

    public void softDelete() {
        this.deletedAt = Instant.now();
    }
}
