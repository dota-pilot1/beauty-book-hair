package com.cj.beautybook.beauty_service.application;

import com.cj.beautybook.beauty_service.domain.BeautyService;
import com.cj.beautybook.beauty_service.domain.BeautyServiceCategory;
import com.cj.beautybook.beauty_service.domain.BeautyServiceTargetGender;
import com.cj.beautybook.beauty_service.infrastructure.BeautyServiceCategoryRepository;
import com.cj.beautybook.beauty_service.infrastructure.BeautyServiceRepository;
import com.cj.beautybook.beauty_service.presentation.dto.CreateBeautyServiceRequest;
import com.cj.beautybook.beauty_service.presentation.dto.UpdateBeautyServiceRequest;
import com.cj.beautybook.common.exception.BusinessException;
import com.cj.beautybook.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BeautyServiceService {

    private final BeautyServiceRepository beautyServiceRepository;
    private final BeautyServiceCategoryRepository beautyServiceCategoryRepository;

    @Transactional(readOnly = true)
    public List<BeautyService> findAll(
            Long categoryId,
            BeautyServiceTargetGender targetGender,
            Boolean visible
    ) {
        return beautyServiceRepository.findAllWithCategory()
                .stream()
                .filter(service -> categoryId == null || service.getCategory().getId().equals(categoryId))
                .filter(service -> targetGender == null
                        || service.getTargetGender() == targetGender
                        || service.getTargetGender() == BeautyServiceTargetGender.ALL)
                .filter(service -> visible == null || service.isVisible() == visible)
                .toList();
    }

    @Transactional(readOnly = true)
    public BeautyService getById(Long id) {
        return beautyServiceRepository.findByIdWithCategory(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.BEAUTY_SERVICE_NOT_FOUND));
    }

    @Transactional
    public BeautyService create(CreateBeautyServiceRequest request) {
        if (beautyServiceRepository.existsByCode(request.code())) {
            throw new BusinessException(ErrorCode.BEAUTY_SERVICE_CODE_DUPLICATE);
        }
        BeautyServiceCategory category = beautyServiceCategoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BEAUTY_SERVICE_CATEGORY_NOT_FOUND));
        return beautyServiceRepository.save(BeautyService.create(
                request.code(),
                request.name(),
                category,
                request.description(),
                request.durationMinutes(),
                request.price(),
                request.targetGender(),
                request.visible(),
                request.displayOrder(),
                request.imageUrls()
        ));
    }

    @Transactional
    public BeautyService update(Long id, UpdateBeautyServiceRequest request) {
        BeautyService service = getById(id);
        BeautyServiceCategory category = beautyServiceCategoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BEAUTY_SERVICE_CATEGORY_NOT_FOUND));
        service.update(
                request.name(),
                category,
                request.description(),
                request.durationMinutes(),
                request.price(),
                request.targetGender(),
                request.visible(),
                request.displayOrder(),
                request.imageUrls()
        );
        return service;
    }

    @Transactional
    public void delete(Long id) {
        BeautyService service = getById(id);
        beautyServiceRepository.delete(service);
    }
}
