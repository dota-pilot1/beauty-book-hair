package com.cj.beautybook.beauty_service.presentation;

import com.cj.beautybook.beauty_service.application.BeautyServiceCategoryService;
import com.cj.beautybook.beauty_service.presentation.dto.BeautyServiceCategoryResponse;
import com.cj.beautybook.beauty_service.presentation.dto.CreateBeautyServiceCategoryRequest;
import com.cj.beautybook.beauty_service.presentation.dto.UpdateBeautyServiceCategoryRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "시술 카테고리 관리")
@RestController
@RequestMapping("/api/beauty-service-categories")
@RequiredArgsConstructor
public class BeautyServiceCategoryController {

    private final BeautyServiceCategoryService categoryService;

    @GetMapping
    public List<BeautyServiceCategoryResponse> list(@RequestParam(required = false) Boolean visible) {
        return categoryService.findAll(visible).stream()
                .map(BeautyServiceCategoryResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    public BeautyServiceCategoryResponse get(@PathVariable Long id) {
        return BeautyServiceCategoryResponse.from(categoryService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public BeautyServiceCategoryResponse create(@Valid @RequestBody CreateBeautyServiceCategoryRequest request) {
        return BeautyServiceCategoryResponse.from(categoryService.create(request));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public BeautyServiceCategoryResponse update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateBeautyServiceCategoryRequest request
    ) {
        return BeautyServiceCategoryResponse.from(categoryService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        categoryService.delete(id);
    }
}
