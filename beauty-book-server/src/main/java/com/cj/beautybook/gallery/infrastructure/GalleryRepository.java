package com.cj.beautybook.gallery.infrastructure;

import com.cj.beautybook.gallery.domain.Gallery;
import com.cj.beautybook.gallery.domain.GalleryPhotoType;
import com.cj.beautybook.gallery.domain.GalleryTag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GalleryRepository extends JpaRepository<Gallery, Long> {

    @Query("SELECT g FROM Gallery g WHERE g.isPublished = true " +
           "AND (:tag IS NULL OR g.tag = :tag) " +
           "AND (:photoType IS NULL OR g.photoType = :photoType) " +
           "AND (:designerId IS NULL OR g.designerId = :designerId)")
    Page<Gallery> findPublicWithFilters(
            @Param("tag") GalleryTag tag,
            @Param("photoType") GalleryPhotoType photoType,
            @Param("designerId") Long designerId,
            Pageable pageable
    );
}
