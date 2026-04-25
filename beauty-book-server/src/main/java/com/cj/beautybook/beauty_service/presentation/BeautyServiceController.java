package com.cj.beautybook.beauty_service.presentation;

import com.cj.beautybook.beauty_service.application.BeautyServiceService;
import com.cj.beautybook.beauty_service.domain.BeautyServiceTargetGender;
import com.cj.beautybook.beauty_service.presentation.dto.BeautyServiceResponse;
import com.cj.beautybook.beauty_service.presentation.dto.CreateBeautyServiceRequest;
import com.cj.beautybook.beauty_service.presentation.dto.UpdateBeautyServiceRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@Tag(name = "시술 정보 관리")
@RestController
@RequestMapping("/api/beauty-services")
@RequiredArgsConstructor
public class BeautyServiceController {

    private final BeautyServiceService beautyServiceService;

    @GetMapping
    public List<BeautyServiceResponse> list(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BeautyServiceTargetGender targetGender,
            @RequestParam(required = false) Boolean visible
    ) {
        Set<Long> activeIds = beautyServiceService.findServiceIdsWithActiveReservations();
        return beautyServiceService.findAll(categoryId, targetGender, visible)
                .stream()
                .map(s -> BeautyServiceResponse.from(s, activeIds.contains(s.getId())))
                .toList();
    }

    @GetMapping("/{id}")
    public BeautyServiceResponse get(@PathVariable Long id) {
        return BeautyServiceResponse.from(
            beautyServiceService.getById(id),
            beautyServiceService.hasActiveReservations(id)
        );
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public BeautyServiceResponse create(@Valid @RequestBody CreateBeautyServiceRequest request) {
        return BeautyServiceResponse.from(beautyServiceService.create(request), false);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public BeautyServiceResponse update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateBeautyServiceRequest request
    ) {
        return BeautyServiceResponse.from(beautyServiceService.update(id, request), beautyServiceService.hasActiveReservations(id));
    }

    @DeleteMapping("/batch")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBatch(@RequestBody List<Long> ids) {
        beautyServiceService.deleteBatch(ids);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        beautyServiceService.delete(id);
    }
}
