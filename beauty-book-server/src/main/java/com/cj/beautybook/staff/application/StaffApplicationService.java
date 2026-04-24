package com.cj.beautybook.staff.application;

import com.cj.beautybook.beauty_service.domain.BeautyService;
import com.cj.beautybook.beauty_service.infrastructure.BeautyServiceRepository;
import com.cj.beautybook.common.exception.BusinessException;
import com.cj.beautybook.common.exception.ErrorCode;
import com.cj.beautybook.staff.domain.Staff;
import com.cj.beautybook.staff.domain.StaffRole;
import com.cj.beautybook.staff.domain.StaffService;
import com.cj.beautybook.staff.infrastructure.StaffRepository;
import com.cj.beautybook.staff.infrastructure.StaffServiceRepository;
import com.cj.beautybook.staff.presentation.dto.CreateStaffRequest;
import com.cj.beautybook.staff.presentation.dto.UpdateStaffRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffApplicationService {

    private final StaffRepository staffRepository;
    private final StaffServiceRepository staffServiceRepository;
    private final BeautyServiceRepository beautyServiceRepository;

    @Transactional(readOnly = true)
    public List<Staff> findDesigners(Long beautyServiceId) {
        if (beautyServiceId == null) {
            return staffRepository.findByActiveTrueOrderByDisplayOrderAscNameAsc()
                    .stream()
                    .filter(s -> s.getRole() == StaffRole.DESIGNER)
                    .toList();
        }

        return staffServiceRepository.findByBeautyServiceIdAndActiveTrue(beautyServiceId)
                .stream()
                .map(StaffService::getStaff)
                .filter(s -> s.isActive() && s.getRole() == StaffRole.DESIGNER)
                .sorted(Comparator.comparing(Staff::getDisplayOrder).thenComparing(Staff::getName))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Staff> findAllForAdmin() {
        return staffRepository.findAllByOrderByDisplayOrderAscNameAsc();
    }

    @Transactional(readOnly = true)
    public Staff getStaff(Long staffId) {
        return staffRepository.findById(staffId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STAFF_NOT_FOUND));
    }

    @Transactional
    public Staff create(CreateStaffRequest request) {
        Staff staff = Staff.create(
                request.name(),
                request.role(),
                request.profileImageUrl(),
                request.introduction(),
                request.active(),
                request.displayOrder()
        );
        return staffRepository.save(staff);
    }

    @Transactional
    public Staff update(Long staffId, UpdateStaffRequest request) {
        Staff staff = getStaff(staffId);
        staff.update(
                request.name(),
                request.role(),
                request.profileImageUrl(),
                request.introduction(),
                request.active(),
                request.displayOrder()
        );
        return staff;
    }

    @Transactional(readOnly = true)
    public List<StaffService> findStaffServices(Long staffId) {
        getStaff(staffId);
        return staffServiceRepository.findByStaffId(staffId);
    }

    @Transactional
    public List<StaffService> replaceStaffServices(Long staffId, Set<Long> beautyServiceIds) {
        Staff staff = getStaff(staffId);
        List<StaffService> currentMappings = staffServiceRepository.findByStaffId(staffId);

        currentMappings.forEach(mapping -> mapping.updateActive(beautyServiceIds.contains(mapping.getBeautyService().getId())));

        Set<Long> currentServiceIds = currentMappings.stream()
                .map(mapping -> mapping.getBeautyService().getId())
                .collect(Collectors.toSet());

        beautyServiceIds.stream()
                .filter(beautyServiceId -> !currentServiceIds.contains(beautyServiceId))
                .map(beautyServiceId -> beautyServiceRepository.findById(beautyServiceId)
                        .orElseThrow(() -> new BusinessException(ErrorCode.BEAUTY_SERVICE_NOT_FOUND)))
                .map(beautyService -> StaffService.create(staff, beautyService, true))
                .forEach(staffServiceRepository::save);

        return staffServiceRepository.findByStaffId(staffId);
    }

    @Transactional(readOnly = true)
    public void validateCanPerform(Long staffId, Long beautyServiceId) {
        boolean available = staffServiceRepository
                .existsByStaffIdAndBeautyServiceIdAndActiveTrue(staffId, beautyServiceId);
        if (!available) {
            throw new BusinessException(ErrorCode.STAFF_SERVICE_NOT_FOUND);
        }

        Staff staff = getStaff(staffId);
        BeautyService beautyService = beautyServiceRepository.findById(beautyServiceId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BEAUTY_SERVICE_NOT_FOUND));
        if (!staff.isActive() || !beautyService.isVisible()) {
            throw new BusinessException(ErrorCode.STAFF_SERVICE_NOT_FOUND);
        }
    }
}
