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
import com.cj.beautybook.reservation.presentation.dto.StaffSlotResponse;
import com.cj.beautybook.schedule.domain.BlockedTime;
import com.cj.beautybook.schedule.domain.BusinessHour;
import com.cj.beautybook.schedule.domain.RecurringBlockedTime;
import com.cj.beautybook.schedule.domain.StaffWorkingHour;
import com.cj.beautybook.schedule.infrastructure.BlockedTimeRepository;
import com.cj.beautybook.schedule.infrastructure.BusinessHourRepository;
import com.cj.beautybook.schedule.infrastructure.RecurringBlockedTimeRepository;
import com.cj.beautybook.schedule.infrastructure.StaffWorkingHourRepository;
import com.cj.beautybook.staff.domain.Staff;
import com.cj.beautybook.staff.domain.StaffService;
import com.cj.beautybook.staff.infrastructure.StaffRepository;
import com.cj.beautybook.staff.infrastructure.StaffServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.beautybook.schedule.domain.BlockedTimeType;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashSet;
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
    private final RecurringBlockedTimeRepository recurringBlockedTimeRepository;
    private final ReservationRepository reservationRepository;

    @Transactional(readOnly = true)
    public List<ReservationSlotResponse> findSlots(List<Long> beautyServiceIds, LocalDate date, Long staffId) {
        if (beautyServiceIds == null || beautyServiceIds.isEmpty()) {
            throw new BusinessException(ErrorCode.BEAUTY_SERVICE_NOT_FOUND);
        }
        List<Long> orderedServiceIds = new ArrayList<>(new LinkedHashSet<>(beautyServiceIds));

        Map<Long, BeautyService> serviceMap = beautyServiceRepository.findAllById(orderedServiceIds).stream()
                .collect(Collectors.toMap(BeautyService::getId, Function.identity()));
        if (serviceMap.size() != orderedServiceIds.size()) {
            throw new BusinessException(ErrorCode.BEAUTY_SERVICE_NOT_FOUND);
        }
        int durationMinutes = orderedServiceIds.stream()
                .mapToInt(id -> serviceMap.get(id).getDurationMinutes())
                .sum();

        List<Staff> staffList = findCandidateStaff(orderedServiceIds, staffId);
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

        // 반복 차단: 해당 요일에 해당하는 항목을 당일 Instant로 변환해서 일회성 차단에 머지
        List<RecurringBlockedTime> allRecurring = recurringBlockedTimeRepository.findByActiveTrue();
        List<BlockedTime> recurringAsBlocked = allRecurring.stream()
                .filter(r -> r.parseDaysOfWeek().contains(dayOfWeek))
                .map(r -> BlockedTime.create(
                        r.getStaff(),
                        date.atTime(r.getStartTime()).atZone(STORE_ZONE).toInstant(),
                        date.atTime(r.getEndTime()).atZone(STORE_ZONE).toInstant(),
                        r.getReason(),
                        r.getBlockType()
                ))
                .toList();

        Map<Long, List<BlockedTime>> blockedTimes = staffList.stream()
                .collect(Collectors.toMap(
                        Staff::getId,
                        staff -> {
                            List<BlockedTime> oneTime = blockedTimeRepository.findConflicting(staff.getId(), dayStart, dayEnd);
                            List<BlockedTime> recurring = recurringAsBlocked.stream()
                                    .filter(b -> b.getStaff() == null || b.getStaff().getId().equals(staff.getId()))
                                    .toList();
                            List<BlockedTime> merged = new ArrayList<>(oneTime);
                            merged.addAll(recurring);
                            return merged;
                        }
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

        int occupiedUnitCount = (int) Math.ceil((double) durationMinutes / SLOT_UNIT_MINUTES);
        LocalDateTime cursor = date.atTime(businessHour.getOpenTime());
        LocalDateTime closeAt = date.atTime(businessHour.getCloseTime());
        Instant now = Instant.now();

        List<ReservationSlotResponse> responses = new ArrayList<>();
        while (!cursor.plusMinutes(durationMinutes).isAfter(closeAt)) {
            LocalDateTime startLocalDateTime = cursor;
            LocalDateTime endLocalDateTime = startLocalDateTime.plusMinutes(durationMinutes);
            Instant startAt = startLocalDateTime.atZone(STORE_ZONE).toInstant();
            Instant endAt = endLocalDateTime.atZone(STORE_ZONE).toInstant();

            if (startAt.isBefore(now)) {
                responses.add(new ReservationSlotResponse(
                        startAt.toString(), startAt, endAt, durationMinutes,
                        SLOT_UNIT_MINUTES, occupiedUnitCount,
                        ReservationSlotStatus.PAST, false, List.of(), "지난 시간입니다.", null
                ));
                cursor = cursor.plusMinutes(SLOT_UNIT_MINUTES);
                continue;
            }

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
                    ? resolveUnavailableStatus(staffList, blockedTimes, reservations, startAt, endAt)
                    : ReservationSlotStatus.AVAILABLE;

            String reason;
            if (status == ReservationSlotStatus.BLOCKED) {
                final Instant slotStart = startAt;
                reason = blockedTimes.values().stream()
                        .flatMap(List::stream)
                        .filter(bt -> bt.getBlockType() != BlockedTimeType.LUNCH)
                        .filter(bt -> overlaps(bt.getStartAt(), bt.getEndAt(), startAt, endAt))
                        .findFirst()
                        .map(bt -> describeBlockedReason(slotStart, bt))
                        .orElse("근무 외 시간이에요.");
            } else if (status == ReservationSlotStatus.RESERVED || status == ReservationSlotStatus.REQUESTED) {
                reason = describeReservationReason(staffList, reservations, status, startAt);
            } else {
                reason = reasonFor(status, availableStaff.size());
            }

            // AVAILABLE 슬롯이 점심 시간을 가로지를 때 안내 메시지 표시.
            String notice = null;
            if (status == ReservationSlotStatus.AVAILABLE) {
                notice = blockedTimes.values().stream()
                        .flatMap(List::stream)
                        .filter(bt -> bt.getBlockType() == BlockedTimeType.LUNCH)
                        .filter(bt -> overlaps(bt.getStartAt(), bt.getEndAt(), startAt, endAt))
                        .findFirst()
                        .map(bt -> "🍱 점심 시간(" + formatHHmm(bt.getStartAt()) + "~" + formatHHmm(bt.getEndAt()) + ")과 겹쳐요")
                        .orElse(null);
            }

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
                    reason,
                    notice
            ));

            cursor = cursor.plusMinutes(SLOT_UNIT_MINUTES);
        }

        return responses;
    }

    private List<Staff> findCandidateStaff(List<Long> beautyServiceIds, Long staffId) {
        // 메인 시술(첫 번째)만 디자이너 자격에 사용한다. 옵션 시술은 메인 디자이너가 함께 진행한다.
        Long mainServiceId = beautyServiceIds.get(0);

        if (staffId != null) {
            Staff staff = staffRepository.findById(staffId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.STAFF_NOT_FOUND));
            boolean canPerformMain = staffServiceRepository
                    .existsByStaffIdAndBeautyServiceIdAndActiveTrue(staffId, mainServiceId);
            if (!staff.isActive() || !canPerformMain) {
                throw new BusinessException(ErrorCode.STAFF_SERVICE_NOT_FOUND);
            }
            return List.of(staff);
        }

        return staffServiceRepository.findByBeautyServiceIdAndActiveTrue(mainServiceId)
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

        // 블록타임 체크: 점심 시간(LUNCH)은 안내만 하고 가로지를 수 있도록 허용한다.
        // 매장 휴무·디자이너 휴무·교육 등 그 외 차단은 절대 시간이라 시술 시간이 겹치면 불가.
        boolean blocked = blockedTimes.stream()
                .filter(bt -> bt.getBlockType() != BlockedTimeType.LUNCH)
                .anyMatch(bt -> overlaps(bt.getStartAt(), bt.getEndAt(), startAt, endAt));
        if (blocked) {
            return false;
        }

        // 예약 겹침 체크: 전체 시술 시간으로 이중 예약 방지
        return reservations.stream().noneMatch(reservation -> overlaps(
                reservation.getStartAt(),
                reservation.getEndAt(),
                startAt,
                endAt
        ));
    }

    private ReservationSlotStatus resolveUnavailableStatus(
            List<Staff> staffList,
            Map<Long, List<BlockedTime>> blockedTimes,
            Map<Long, List<Reservation>> reservations,
            Instant startAt,
            Instant endAt
    ) {
        // 점심 시간이 아닌 차단 시간(매장 휴무·디자이너 휴무·교육 등)이 시술 시간과 겹치면 BLOCKED 우선.
        // 점심은 가로지를 수 있도록 허용하므로 BLOCKED 가 아니라 RESERVED/REQUESTED 등이 우선.
        boolean hasHardBlock = staffList.stream()
                .flatMap(staff -> blockedTimes.getOrDefault(staff.getId(), List.of()).stream())
                .filter(bt -> bt.getBlockType() != BlockedTimeType.LUNCH)
                .anyMatch(bt -> overlaps(bt.getStartAt(), bt.getEndAt(), startAt, endAt));
        if (hasHardBlock) {
            return ReservationSlotStatus.BLOCKED;
        }

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
            case REQUESTED -> "다른 고객이 승인 대기 중이에요.";
            case RESERVED -> "이미 예약된 시간이에요.";
            case BLOCKED -> "근무 외 시간이에요.";
            case PAST -> "지나간 시간이에요.";
        };
    }

    /**
     * 예약 충돌 메시지: 슬롯 자체가 예약 안인지, 시술이 다음 예약을 가로지르는 건지 구분.
     */
    private String describeReservationReason(
            List<Staff> staffList,
            Map<Long, List<Reservation>> reservations,
            ReservationSlotStatus status,
            Instant startAt
    ) {
        Instant slotWindowEnd = startAt.plusSeconds(SLOT_UNIT_MINUTES * 60L);
        ReservationStatus targetStatus = status == ReservationSlotStatus.RESERVED
                ? ReservationStatus.CONFIRMED
                : ReservationStatus.REQUESTED;
        boolean slotItselfTaken = staffList.stream()
                .flatMap(staff -> reservations.getOrDefault(staff.getId(), List.of()).stream())
                .filter(r -> r.getStatus() == targetStatus)
                .anyMatch(r -> overlaps(r.getStartAt(), r.getEndAt(), startAt, slotWindowEnd));

        if (slotItselfTaken) {
            return status == ReservationSlotStatus.RESERVED
                    ? "이미 예약된 시간이에요."
                    : "다른 고객이 승인 대기 중이에요.";
        }
        // 슬롯 자체는 비어있지만 시술 시간이 다음 예약과 겹치는 경우
        return status == ReservationSlotStatus.RESERVED
                ? "다음 예약과 시간이 겹쳐요."
                : "다음 요청과 시간이 겹쳐요.";
    }

    private String formatHHmm(Instant instant) {
        return instant.atZone(STORE_ZONE).toLocalTime()
                .format(java.time.format.DateTimeFormatter.ofPattern("HH:mm"));
    }

    /**
     * 차단 시간 표시 메시지 결정.
     * - 슬롯 시작이 차단 구간 안: 슬롯 자체가 차단 시간 (예: "🚪 매장 휴무")
     * - 슬롯 시작은 차단 구간 밖이지만 시술 시간이 차단 구간으로 침범: 시간 부족
     */
    private String describeBlockedReason(Instant slotStart, BlockedTime bt) {
        String label = blockTypeLabel(bt.getBlockType());
        String reasonSuffix = (bt.getReason() != null && !bt.getReason().isBlank())
                ? " · " + bt.getReason()
                : "";

        boolean slotInsideBlock = !slotStart.isBefore(bt.getStartAt()) && slotStart.isBefore(bt.getEndAt());
        if (slotInsideBlock) {
            return label + reasonSuffix;
        }
        return label + " 전이라 시술이 다 끝나지 않아요" + reasonSuffix;
    }

    private String blockTypeLabel(BlockedTimeType type) {
        return switch (type) {
            case LUNCH -> "🍱 점심 시간";
            case STORE_CLOSED -> "🚪 매장 휴무";
            case DESIGNER_OFF -> "💆 디자이너 휴무";
            case EDUCATION -> "📚 교육";
            case PERSONAL -> "🙏 개인 사정";
            case ETC -> "📌 기타";
        };
    }

    @Transactional(readOnly = true)
    public List<StaffSlotResponse> findStaffAvailability(Long staffId, LocalDate date) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STAFF_NOT_FOUND));

        DayOfWeek dayOfWeek = date.getDayOfWeek();
        BusinessHour businessHour = businessHourRepository.findByDayOfWeek(dayOfWeek)
                .orElseThrow(() -> new BusinessException(ErrorCode.BUSINESS_HOUR_NOT_FOUND));

        if (businessHour.isClosed() || businessHour.getOpenTime() == null || businessHour.getCloseTime() == null) {
            return List.of();
        }

        Instant dayStart = date.atStartOfDay(STORE_ZONE).toInstant();
        Instant dayEnd = date.plusDays(1).atStartOfDay(STORE_ZONE).toInstant();

        StaffWorkingHour workingHour = staffWorkingHourRepository
                .findByStaffIdAndDayOfWeek(staffId, dayOfWeek)
                .orElse(null);

        List<RecurringBlockedTime> allRecurring = recurringBlockedTimeRepository.findByActiveTrue();
        List<BlockedTime> recurringBlocked = allRecurring.stream()
                .filter(r -> r.parseDaysOfWeek().contains(dayOfWeek))
                .filter(r -> r.getStaff() == null || r.getStaff().getId().equals(staffId))
                .map(r -> BlockedTime.create(
                        r.getStaff(),
                        date.atTime(r.getStartTime()).atZone(STORE_ZONE).toInstant(),
                        date.atTime(r.getEndTime()).atZone(STORE_ZONE).toInstant(),
                        r.getReason(),
                        r.getBlockType()
                ))
                .toList();

        List<BlockedTime> oneTimeBlocked = blockedTimeRepository.findConflicting(staffId, dayStart, dayEnd);
        List<BlockedTime> allBlocked = new ArrayList<>(oneTimeBlocked);
        allBlocked.addAll(recurringBlocked);

        List<Reservation> reservations = reservationRepository
                .findByStaffIdAndStartAtLessThanAndEndAtGreaterThanAndStatusIn(
                        staffId, dayEnd, dayStart, OCCUPYING_STATUSES);

        LocalDateTime cursor = date.atTime(businessHour.getOpenTime());
        LocalDateTime closeAt = date.atTime(businessHour.getCloseTime());
        Instant now = Instant.now();

        List<StaffSlotResponse> result = new ArrayList<>();
        while (cursor.isBefore(closeAt)) {
            Instant startAt = cursor.atZone(STORE_ZONE).toInstant();
            Instant endAt = cursor.plusMinutes(SLOT_UNIT_MINUTES).atZone(STORE_ZONE).toInstant();

            String status;
            String blockType = null;
            String reason = null;

            boolean isOffDuty = workingHour == null || !workingHour.isWorking()
                    || workingHour.getStartTime() == null || workingHour.getEndTime() == null
                    || cursor.toLocalTime().isBefore(workingHour.getStartTime())
                    || cursor.plusMinutes(SLOT_UNIT_MINUTES).toLocalTime().isAfter(workingHour.getEndTime());

            BlockedTime overlappingBlock = allBlocked.stream()
                    .filter(b -> overlaps(b.getStartAt(), b.getEndAt(), startAt, endAt))
                    .findFirst()
                    .orElse(null);

            if (overlappingBlock != null) {
                status = "BLOCKED";
                blockType = overlappingBlock.getBlockType().name();
                reason = overlappingBlock.getReason();
            } else if (startAt.isBefore(now)) {
                status = "PAST";
            } else if (isOffDuty) {
                status = "OFF_DUTY";
            } else if (reservations.stream().anyMatch(r ->
                    r.getStatus() == ReservationStatus.CONFIRMED && overlaps(r.getStartAt(), r.getEndAt(), startAt, endAt))) {
                status = "BOOKED";
            } else if (reservations.stream().anyMatch(r ->
                    r.getStatus() == ReservationStatus.REQUESTED && overlaps(r.getStartAt(), r.getEndAt(), startAt, endAt))) {
                status = "REQUESTED";
            } else {
                status = "AVAILABLE";
            }

            result.add(new StaffSlotResponse(startAt.toString(), endAt.toString(), status, blockType, reason));
            cursor = cursor.plusMinutes(SLOT_UNIT_MINUTES);
        }

        return result;
    }
}
