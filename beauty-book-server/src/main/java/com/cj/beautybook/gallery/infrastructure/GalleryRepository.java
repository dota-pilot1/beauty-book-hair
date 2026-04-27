package com.cj.beautybook.gallery.infrastructure;

import com.cj.beautybook.gallery.domain.Gallery;
import com.cj.beautybook.gallery.domain.GalleryTag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GalleryRepository extends JpaRepository<Gallery, Long> {

    Page<Gallery> findByIsPublishedTrue(Pageable pageable);

    Page<Gallery> findByIsPublishedTrueAndTag(GalleryTag tag, Pageable pageable);

    Page<Gallery> findByIsPublishedTrueAndDesignerId(Long designerId, Pageable pageable);

    Page<Gallery> findByIsPublishedTrueAndTagAndDesignerId(GalleryTag tag, Long designerId, Pageable pageable);
}
