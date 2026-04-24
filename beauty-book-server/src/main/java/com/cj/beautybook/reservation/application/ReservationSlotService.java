package com.cj.beautybook.reservation.application;

import com.cj.beautybook.beauty_service.domain.BeautyService;
import com.cj.beautybook.beauty_service.infrastructure.BeautyServiceRepository;
import com.cj.beautybook.common.exception.BusinessException;
import com.cj.beautybook.common.exception.ErrorCode;
import com.cj.beautybook.reservation.domain.Reservation;
import com.cj.beautybook.reservation.domain.ReservationStatus;
import com.cj.beautybook.reservation.infrastructure.ReservationRepository;
import com.cj.beautybook.reservation.presentation.dto.AvailableStaffResponse;
import com.cj.beautybook.reservation.presentation.dto.ReservationSlotResponse;
import com.cj.beautybook.schedule.domain.BlockedTime;
import com.cj.beautybook.schedule.domain.BusinessHour;
import com.cj.beautybook.schedule.domain.StaffWorkingHour;
import com.cj.beautybook.schedule.infrastructure.BlockedTimeRepository;
import com.cj.beautybook.schedule.infrastructure.BusinessHourRepository;
import com.cj.beautybook.schedule.infrastructure.StaffWorkingHourRepository;
import com.cj.beautybook.staff.domain.Staff;
import com.cj.beautybook.staff.domain.StaffService;
import com.cj.beautybook.staff.infrastructure.StaffRepository;
import com.cj.beautybook.staff.infrastructure.StaffServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collection;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationSlotService {

    private static final ZoneId STORE_ZONE = ZoneId.of("Asia/Seoul");
    private static final int SLOT_UNIT_MINUTES = 30;
    private static final Collection<ReservationStatus> OCCUPYING_STATUSES = EnumSet.of(
            ReservationStatus.REQUESTED,
            ReservationStatus.CONFIRMED
    );

    private final BeautyServiceRepository beautyServiceRepository;
    private final StaffRepository staffRepository;
    private final StaffServiceRepository staffServiceRepository;
    private final BusinessHourRepository businessHourRepository;
    private final StaffWorkingHourRepository staffWorkingHourRepository;
    private final BlockedTimeRepository blockedTimeRepository;
    private final ReservationRepository reservationRepository;

    @Transactional(readOnly = true)
    public List<ReservationSlotResponse> findSlots(Long beautyServiceId, LocalDate date, Long staffId) {
        BeautyService beautyService = beautyServiceRepository.findById(beautyServiceId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BEAUTY_SERVICE_NOT_FOUND));

        List<Staff> staffList = findCandidateStaff(beautyServiceId, staffId);
        if (staffList.isEmpty()) {
            return List.of();
        }

        DayOfWeek dayOfWeek = date.getDayOfWeek();
        BusinessHour businessHour = businessHourRepository.findByDayOfWeek(dayOfWeek)
                .orElseThrow(() -> new BusinessException(ErrorCode.BUSINESS_HOUR_NOT_FOUND));
        if (businessHour.isClosed() || businessHour.getOpenTime() == null || businessHour.getCloseTime() == null) {
            return List.of();
        }

        Instant dayStart = date.atStartOfDay(STORE_ZONE).toInstant();
        Instant dayEnd = date.plusDays(1).atStartOfDay(STORE_ZONE).toInstant();

        Map<Long, StaffWorkingHour> workingHours = staffList.stream()
                .map(staff -> staffWorkingHourRepository.findByStaffIdAndDayOfWeek(staff.getId(), dayOfWeek)
                        .orElse(null))
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(wh -> wh.getStaff().getId(), Function.identity()));

        Map<Long, List<BlockedTime>> blockedTimes = staffList.stream()
                .collect(Collectors.toMap(
                        Staff::getId,
                        staff -> blockedTimeRepository.findConflicting(staff.getId(), dayStart, dayEnd)
                ));

        Map<Long, List<Reservation>> reservations = staffList.stream()
                .collect(Collectors.toMap(
                        Staff::getId,
                        staff -> reservationRepository.findByStaffIdAndStartAtLessThanAndEndAtGreaterThanAndStatusIn(
                                staff.getId(),
                                dayEnd,
                                dayStart,
                                OCCUPYING_STATUSES
                        )
                ));

        int durationMinutes = beautyService.getDurationMinutes();
        int occupiedUnitCount = (int) Math.ceil((double) durationMinutes / SLOT_UNIT_MINUTES);
        LocalDateTime cursor = date.atTime(businessHour.getOpenTime());
        LocalDateTime closeAt = date.atTime(businessHour.getCloseTime());

        List<ReservationSlotResponse> responses = new java.util.ArrayList<>();
        while (!cursor.plusMinutes(durationMinutes).isAfter(closeAt)) {
            LocalDateTime startLocalDateTime = cursor;
            LocalDateTime endLocalDateTime = startLocalDateTime.plusMinutes(durationMinutes);
            Instant startAt = startLocalDateTime.atZone(STORE_ZONE).toInstant();
            Instant endAt = endLocalDateTime.atZone(STORE_ZONE).toInstant();

            List<Staff> availableStaff = staffList.stream()
                    .filter(staff -> isAvailable(
                            staff,
                            workingHours.get(staff.getId()),
                            blockedTimes.getOrDefault(staff.getId(), List.of()),
                            reservations.getOrDefault(staff.getId(), List.of()),
                            startLocalDateTime,
                            endLocalDateTime,
                            startAt,
                            endAt
                    ))
                    .sorted(Comparator.comparing(Staff::getDisplayOrder).thenComparing(Staff::getName))
                    .toList();

            ReservationSlotStatus status = availableStaff.isEmpty()
                    ? resolveUnavailableStatus(staffList, reservations, startAt, endAt)
                    : ReservationSlotStatus.AVAILABLE;

            responses.add(new ReservationSlotResponse(
                    startAt.toString(),
                    startAt,
                    endAt,
                    durationMinutes,
                    SLOT_UNIT_MINUTES,
                    occupiedUnitCount,
                    status,
                    status == ReservationSlotStatus.AVAILABLE,
                    availableStaff.stream().map(AvailableStaffResponse::from).toList(),
                    reasonFor(status, availableStaff.size())
            ));

            cursor = cursor.plusMinutes(SLOT_UNIT_MINUTES);
        }

        return responses;
    }

    private List<Staff> findCandidateStaff(Long beautyServiceId, Long staffId) {
        if (staffId != null) {
            Staff staff = staffRepository.findById(staffId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.STAFF_NOT_FOUND));
            boolean canPerform = staffServiceRepository
                    .existsByStaffIdAndBeautyServiceIdAndActiveTrue(staffId, beautyServiceId);
            if (!staff.isActive() || !canPerform) {
                throw new BusinessException(ErrorCode.STAFF_SERVICE_NOT_FOUND);
            }
            return List.of(staff);
        }

        return staffServiceRepository.findByBeautyServiceIdAndActiveTrue(beautyServiceId)
                .stream()
                .map(StaffService::getStaff)
                .filter(Staff::isActive)
                .sorted(Comparator.comparing(Staff::getDisplayOrder).thenComparing(Staff::getName))
                .toList();
    }

    private boolean isAvailable(
            Staff staff,
            StaffWorkingHour workingHour,
            List<BlockedTime> blockedTimes,
            List<Reservation> reservations,
            LocalDateTime startLocalDateTime,
            LocalDateTime endLocalDateTime,
            Instant startAt,
            Instant endAt
    ) {
        if (workingHour == null || !workingHour.isWorking()) {
            return false;
        }
        if (workingHour.getStartTime() == null || workingHour.getEndTime() == null) {
            return false;
        }

        LocalDateTime workStart = startLocalDateTime.toLocalDate().atTime(workingHour.getStartTime());
        LocalDateTime workEnd = startLocalDateTime.toLocalDate().atTime(workingHour.getEndTime());
        if (startLocalDateTime.isBefore(workStart) || endLocalDateTime.isAfter(workEnd)) {
            return false;
        }

        boolean blocked = blockedTimes.stream().anyMatch(blockedTime -> overlaps(
                blockedTime.getStartAt(),
                blockedTime.getEndAt(),
                startAt,
                endAt
        ));
        if (blocked) {
            return false;
        }

        return reservations.stream().noneMatch(reservation -> overlaps(
                reservation.getStartAt(),
                reservation.getEndAt(),
                startAt,
                endAt
        ));
    }

    private ReservationSlotStatus resolveUnavailableStatus(
            List<Staff> staffList,
            Map<Long, List<Reservation>> reservations,
            Instant startAt,
            Instant endAt
    ) {
        boolean hasConfirmed = staffList.stream()
                .flatMap(staff -> reservations.getOrDefault(staff.getId(), List.of()).stream())
                .anyMatch(reservation -> reservation.getStatus() == ReservationStatus.CONFIRMED
                        && overlaps(reservation.getStartAt(), reservation.getEndAt(), startAt, endAt));
        if (hasConfirmed) {
            return ReservationSlotStatus.RESERVED;
        }

        boolean hasRequested = staffList.stream()
                .flatMap(staff -> reservations.getOrDefault(staff.getId(), List.of()).stream())
                .anyMatch(reservation -> reservation.getStatus() == ReservationStatus.REQUESTED
                        && overlaps(reservation.getStartAt(), reservation.getEndAt(), startAt, endAt));
        if (hasRequested) {
            return ReservationSlotStatus.REQUESTED;
        }

        return ReservationSlotStatus.BLOCKED;
    }

    private boolean overlaps(Instant aStart, Instant aEnd, Instant bStart, Instant bEnd) {
        return aStart.isBefore(bEnd) && aEnd.isAfter(bStart);
    }

    private String reasonFor(ReservationSlotStatus status, int availableStaffCount) {
        return switch (status) {
            case AVAILABLE -> availableStaffCount + "명 예약 가능";
            case REQUESTED -> "승인 대기 예약과 겹칩니다.";
            case RESERVED -> "확정 예약과 겹칩니다.";
            case BLOCKED -> "근무 외 시간 또는 예약 불가 시간입니다.";
        };
    }
}
