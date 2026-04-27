package com.cj.beautybook.gallery.presentation;

import com.cj.beautybook.gallery.application.GalleryService;
import com.cj.beautybook.gallery.domain.GalleryPhotoType;
import com.cj.beautybook.gallery.domain.GalleryTag;
import com.cj.beautybook.gallery.presentation.dto.GalleryCreateRequest;
import com.cj.beautybook.gallery.presentation.dto.GalleryResponse;
import com.cj.beautybook.gallery.presentation.dto.GalleryUpdateRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "갤러리")
@RestController
@RequiredArgsConstructor
public class GalleryController {

    private final GalleryService galleryService;

    // ===== 공개 API =====

    @GetMapping("/api/gallery")
    public Page<GalleryResponse> listPublic(
            @RequestParam(required = false) GalleryTag tag,
            @RequestParam(required = false) GalleryPhotoType photoType,
            @RequestParam(required = false) Long designerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        return galleryService.listPublic(tag, photoType, designerId, pageable);
    }

    @GetMapping("/api/gallery/{id}")
    public GalleryResponse getPublic(@PathVariable Long id) {
        return galleryService.getPublic(id);
    }

    // ===== 어드민 API =====

    @GetMapping("/api/admin/gallery")
    public Page<GalleryResponse> adminList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        return galleryService.listAll(pageable);
    }

    @PostMapping("/api/admin/gallery")
    @ResponseStatus(HttpStatus.CREATED)
    public GalleryResponse adminCreate(@RequestBody @Valid GalleryCreateRequest req) {
        return galleryService.create(req);
    }

    @PutMapping("/api/admin/gallery/{id}")
    public GalleryResponse adminUpdate(
            @PathVariable Long id,
            @RequestBody @Valid GalleryUpdateRequest req
    ) {
        return galleryService.update(id, req);
    }

    @PatchMapping("/api/admin/gallery/{id}/publish")
    public GalleryResponse adminTogglePublish(@PathVariable Long id) {
        return galleryService.togglePublish(id);
    }

    @DeleteMapping("/api/admin/gallery/{id}")
    public ResponseEntity<Void> adminDelete(@PathVariable Long id) {
        galleryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
