package com.cj.beautybook.gallery.application;

import com.cj.beautybook.common.exception.BusinessException;
import com.cj.beautybook.common.exception.ErrorCode;
import com.cj.beautybook.gallery.domain.Gallery;
import com.cj.beautybook.gallery.domain.GalleryTag;
import com.cj.beautybook.gallery.infrastructure.GalleryRepository;
import com.cj.beautybook.gallery.presentation.dto.GalleryCreateRequest;
import com.cj.beautybook.gallery.presentation.dto.GalleryResponse;
import com.cj.beautybook.gallery.presentation.dto.GalleryUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GalleryService {

    private final GalleryRepository galleryRepository;

    // ===== 공개 =====

    @Transactional(readOnly = true)
    public Page<GalleryResponse> listPublic(GalleryTag tag, Long designerId, Pageable pageable) {
        if (tag != null && designerId != null) {
            return galleryRepository.findByIsPublishedTrueAndTagAndDesignerId(tag, designerId, pageable)
                    .map(GalleryResponse::from);
        }
        if (tag != null) {
            return galleryRepository.findByIsPublishedTrueAndTag(tag, pageable)
                    .map(GalleryResponse::from);
        }
        if (designerId != null) {
            return galleryRepository.findByIsPublishedTrueAndDesignerId(designerId, pageable)
                    .map(GalleryResponse::from);
        }
        return galleryRepository.findByIsPublishedTrue(pageable)
                .map(GalleryResponse::from);
    }

    @Transactional
    public GalleryResponse getPublic(Long id) {
        Gallery gallery = galleryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.GALLERY_NOT_FOUND));
        gallery.incrementView();
        return GalleryResponse.from(galleryRepository.save(gallery));
    }

    // ===== 어드민 =====

    @Transactional(readOnly = true)
    public Page<GalleryResponse> listAll(Pageable pageable) {
        return galleryRepository.findAll(pageable).map(GalleryResponse::from);
    }

    @Transactional
    public GalleryResponse create(GalleryCreateRequest req) {
        Gallery gallery = Gallery.create(
                req.title(),
                req.description(),
                req.imageUrls(),
                req.beforeImageUrl(),
                req.designerId(),
                req.designerName(),
                req.tag(),
                req.isPublished()
        );
        return GalleryResponse.from(galleryRepository.save(gallery));
    }

    @Transactional
    public GalleryResponse update(Long id, GalleryUpdateRequest req) {
        Gallery gallery = galleryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.GALLERY_NOT_FOUND));
        gallery.update(
                req.title(),
                req.description(),
                req.imageUrls(),
                req.beforeImageUrl(),
                req.designerId(),
                req.designerName(),
                req.tag(),
                req.isPublished()
        );
        return GalleryResponse.from(galleryRepository.save(gallery));
    }

    @Transactional
    public GalleryResponse togglePublish(Long id) {
        Gallery gallery = galleryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.GALLERY_NOT_FOUND));
        gallery.togglePublish();
        return GalleryResponse.from(galleryRepository.save(gallery));
    }

    @Transactional
    public void delete(Long id) {
        Gallery gallery = galleryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.GALLERY_NOT_FOUND));
        gallery.softDelete();
        galleryRepository.save(gallery);
    }
}
