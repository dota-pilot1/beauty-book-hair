package com.cj.beautybook.beauty_service.application;

import com.cj.beautybook.beauty_service.domain.BeautyServiceCategory;
import com.cj.beautybook.beauty_service.infrastructure.BeautyServiceCategoryRepository;
import com.cj.beautybook.beauty_service.infrastructure.BeautyServiceRepository;
import com.cj.beautybook.beauty_service.presentation.dto.CreateBeautyServiceCategoryRequest;
import com.cj.beautybook.beauty_service.presentation.dto.UpdateBeautyServiceCategoryRequest;
import com.cj.beautybook.common.exception.BusinessException;
import com.cj.beautybook.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BeautyServiceCategoryService {

    private final BeautyServiceCategoryRepository categoryRepository;
    private final BeautyServiceRepository beautyServiceRepository;

    @Transactional(readOnly = true)
    public List<BeautyServiceCategory> findAll(Boolean visible) {
        return categoryRepository.findAll(Sort.by(Sort.Order.asc("displayOrder"), Sort.Order.asc("id")))
                .stream()
                .filter(category -> visible == null || category.isVisible() == visible)
                .toList();
    }

    @Transactional(readOnly = true)
    public BeautyServiceCategory getById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.BEAUTY_SERVICE_CATEGORY_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public BeautyServiceCategory getByCode(String code) {
        return categoryRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException(ErrorCode.BEAUTY_SERVICE_CATEGORY_NOT_FOUND));
    }

    @Transactional
    public BeautyServiceCategory create(CreateBeautyServiceCategoryRequest request) {
        if (categoryRepository.existsByCode(request.code())) {
            throw new BusinessException(ErrorCode.BEAUTY_SERVICE_CATEGORY_CODE_DUPLICATE);
        }
        long nextOrder = categoryRepository.count();
        return categoryRepository.save(BeautyServiceCategory.create(
                request.code(),
                request.name(),
                request.description(),
                request.visible(),
                request.displayOrder() != null ? request.displayOrder() : (int) nextOrder
        ));
    }

    @Transactional
    public BeautyServiceCategory update(Long id, UpdateBeautyServiceCategoryRequest request) {
        BeautyServiceCategory category = getById(id);
        category.update(
                request.name(),
                request.description(),
                request.visible(),
                request.displayOrder()
        );
        return category;
    }

    @Transactional
    public void delete(Long id) {
        BeautyServiceCategory category = getById(id);
        if (beautyServiceRepository.existsByCategory(category)) {
            throw new BusinessException(ErrorCode.BEAUTY_SERVICE_CATEGORY_IN_USE);
        }
        categoryRepository.delete(category);
    }
}
