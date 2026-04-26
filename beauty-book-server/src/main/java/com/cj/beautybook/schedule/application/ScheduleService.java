package com.cj.beautybook.schedule.application;

import com.cj.beautybook.common.exception.BusinessException;
import com.cj.beautybook.common.exception.ErrorCode;
import com.cj.beautybook.schedule.domain.BlockedTime;
import com.cj.beautybook.schedule.domain.BusinessHour;
import com.cj.beautybook.schedule.domain.StaffWorkingHour;
import com.cj.beautybook.schedule.infrastructure.BlockedTimeRepository;
import com.cj.beautybook.schedule.infrastructure.BusinessHourRepository;
import com.cj.beautybook.schedule.infrastructure.StaffWorkingHourRepository;
import com.cj.beautybook.schedule.presentation.dto.CreateBlockedTimeRequest;
import com.cj.beautybook.schedule.presentation.dto.UpdateBlockedTimeRequest;
import com.cj.beautybook.schedule.presentation.dto.UpdateBusinessHourItem;
import com.cj.beautybook.schedule.presentation.dto.UpdateBusinessHoursRequest;
import com.cj.beautybook.schedule.presentation.dto.UpdateStaffWorkingHourItem;
import com.cj.beautybook.schedule.presentation.dto.UpdateStaffWorkingHoursRequest;
import com.cj.beautybook.staff.domain.Staff;
import com.cj.beautybook.staff.infrastructure.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final BusinessHourRepository businessHourRepository;
    private final StaffWorkingHourRepository staffWorkingHourRepository;
    private final BlockedTimeRepository blockedTimeRepository;
    private final StaffRepository staffRepository;

    @Transactional(readOnly = true)
    public List<BusinessHour> findBusinessHours() {
        return businessHourRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(BusinessHour::getDayOfWeek))
                .toList();
    }

    @Transactional
    public List<BusinessHour> replaceBusinessHours(UpdateBusinessHoursRequest request) {
        request.businessHours().forEach(this::validateBusinessHour);

        request.businessHours().forEach(item -> {
            BusinessHour businessHour = businessHourRepository.findByDayOfWeek(item.dayOfWeek())
                    .orElseGet(() -> BusinessHour.create(item.dayOfWeek(), null, null, item.closed()));
            businessHour.update(
                    item.closed() ? null : item.openTime(),
                    item.closed() ? null : item.closeTime(),
                    item.closed()
            );
            businessHourRepository.save(businessHour);
        });

        return findBusinessHours();
    }

    @Transactional(readOnly = true)
    public List<StaffWorkingHour> findStaffWorkingHours(Long staffId) {
        ensureStaff(staffId);
        return staffWorkingHourRepository.findByStaffIdOrderByDayOfWeekAsc(staffId);
    }

    @Transactional
    public List<StaffWorkingHour> replaceStaffWorkingHours(
            Long staffId,
            UpdateStaffWorkingHoursRequest request
    ) {
        Staff staff = ensureStaff(staffId);
        request.workingHours().forEach(this::validateStaffWorkingHour);

        request.workingHours().forEach(item -> {
            StaffWorkingHour workingHour = staffWorkingHourRepository
                    .findByStaffIdAndDayOfWeek(staffId, item.dayOfWeek())
                    .orElseGet(() -> StaffWorkingHour.create(staff, item.dayOfWeek(), null, null, item.working()));
            workingHour.update(
                    item.working() ? item.startTime() : null,
                    item.working() ? item.endTime() : null,
                    item.working()
            );
            staffWorkingHourRepository.save(workingHour);
        });

        return findStaffWorkingHours(staffId);
    }

    @Transactional(readOnly = true)
    public List<BlockedTime> findBlockedTimes(Long staffId, Instant startAt, Instant endAt) {
        if (staffId != null) {
            ensureStaff(staffId);
        }
        validateInstantRange(startAt, endAt);
        return blockedTimeRepository.findWithin(staffId, startAt, endAt);
    }

    @Transactional
    public BlockedTime createBlockedTime(CreateBlockedTimeRequest request) {
        validateInstantRange(request.startAt(), request.endAt());
        Staff staff = request.staffId() == null ? null : ensureStaff(request.staffId());
        ensureNoBlockedTimeOverlap(null, request.staffId(), request.startAt(), request.endAt());

        return blockedTimeRepository.save(BlockedTime.create(
                staff,
                request.startAt(),
                request.endAt(),
                request.reason(),
                request.blockType()
        ));
    }

    @Transactional
    public BlockedTime updateBlockedTime(Long blockedTimeId, UpdateBlockedTimeRequest request) {
        BlockedTime blockedTime = getBlockedTime(blockedTimeId);
        validateInstantRange(request.startAt(), request.endAt());
        Staff staff = request.staffId() == null ? null : ensureStaff(request.staffId());
        ensureNoBlockedTimeOverlap(blockedTimeId, request.staffId(), request.startAt(), request.endAt());

        blockedTime.update(
                staff,
                request.startAt(),
                request.endAt(),
                request.reason(),
                request.blockType()
        );
        return blockedTime;
    }

    @Transactional
    public void deleteBlockedTime(Long blockedTimeId) {
        BlockedTime blockedTime = getBlockedTime(blockedTimeId);
        blockedTimeRepository.delete(blockedTime);
    }

    private BlockedTime getBlockedTime(Long blockedTimeId) {
        return blockedTimeRepository.findById(blockedTimeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BLOCKED_TIME_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public List<StaffWorkingHour> findAllStaffWorkingHours() {
        return staffWorkingHourRepository.findAll()
                .stream()
                .filter(h -> h.getStaff().isActive())
                .sorted(Comparator
                        .comparingInt((StaffWorkingHour h) -> h.getStaff().getDisplayOrder() == null ? 999 : h.getStaff().getDisplayOrder())
                        .thenComparing(h -> h.getDayOfWeek().getValue()))
                .toList();
    }

    private Staff ensureStaff(Long staffId) {
        return staffRepository.findById(staffId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STAFF_NOT_FOUND));
    }

    private void validateBusinessHour(UpdateBusinessHourItem item) {
        if (item.closed()) {
            return;
        }
        validateLocalTimeRange(item.openTime(), item.closeTime());
    }

    private void validateStaffWorkingHour(UpdateStaffWorkingHourItem item) {
        if (!item.working()) {
            return;
        }
        validateLocalTimeRange(item.startTime(), item.endTime());
    }

    private void validateLocalTimeRange(LocalTime startTime, LocalTime endTime) {
        if (startTime == null || endTime == null || !startTime.isBefore(endTime)) {
            throw new BusinessException(ErrorCode.SCHEDULE_INVALID_TIME_RANGE);
        }
    }

    private void validateInstantRange(Instant startAt, Instant endAt) {
        if (startAt == null || endAt == null || !startAt.isBefore(endAt)) {
            throw new BusinessException(ErrorCode.SCHEDULE_INVALID_TIME_RANGE);
        }
    }

    private void ensureNoBlockedTimeOverlap(Long currentBlockedTimeId, Long staffId, Instant startAt, Instant endAt) {
        boolean hasOverlap = blockedTimeRepository.findConflicting(staffId, startAt, endAt)
                .stream()
                .anyMatch(blockedTime -> !blockedTime.getId().equals(currentBlockedTimeId));
        if (hasOverlap) {
            throw new BusinessException(ErrorCode.BLOCKED_TIME_OVERLAP);
        }
    }
}
