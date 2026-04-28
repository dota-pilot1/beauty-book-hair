package com.cj.beautybook.reservation.application;

import com.cj.beautybook.auth.security.UserPrincipal;
import com.cj.beautybook.beauty_service.domain.BeautyService;
import com.cj.beautybook.beauty_service.infrastructure.BeautyServiceRepository;
import com.cj.beautybook.common.exception.BusinessException;
import com.cj.beautybook.common.exception.ErrorCode;
import com.cj.beautybook.reservation.domain.Reservation;
import com.cj.beautybook.reservation.domain.ReservationStatus;
import com.cj.beautybook.reservation.infrastructure.ReservationRepository;
import com.cj.beautybook.reservation.presentation.dto.ChangeReservationStatusRequest;
import com.cj.beautybook.reservation.presentation.dto.CreateReservationRequest;
import com.cj.beautybook.schedule.domain.BlockedTimeType;
import com.cj.beautybook.schedule.infrastructure.BlockedTimeRepository;
import com.cj.beautybook.schedule.infrastructure.RecurringBlockedTimeRepository;
import com.cj.beautybook.staff.domain.Staff;
import com.cj.beautybook.staff.infrastructure.StaffRepository;
import com.cj.beautybook.staff.infrastructure.StaffServiceRepository;
import com.cj.beautybook.user.domain.User;
import com.cj.beautybook.notification.application.NotificationService;
import com.cj.beautybook.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReservationService {

    private static final ZoneId STORE_ZONE = ZoneId.of("Asia/Seoul");
    private static final List<ReservationStatus> ACTIVE_STATUSES = List.of(
            ReservationStatus.REQUESTED, ReservationStatus.CONFIRMED
    );

    private final ReservationRepository reservationRepository;
    private final BeautyServiceRepository beautyServiceRepository;
    private final StaffRepository staffRepository;
    private final StaffServiceRepository staffServiceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final BlockedTimeRepository blockedTimeRepository;
    private final RecurringBlockedTimeRepository recurringBlockedTimeRepository;

    @Transactional
    public Reservation create(CreateReservationRequest req, UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        List<Long> orderedServiceIds = new ArrayList<>(new LinkedHashSet<>(req.beautyServiceIds()));
        if (orderedServiceIds.isEmpty()) {
            throw new BusinessException(ErrorCode.BEAUTY_SERVICE_NOT_FOUND);
        }

        Map<Long, BeautyService> serviceMap = beautyServiceRepository.findAllById(orderedServiceIds).stream()
                .collect(Collectors.toMap(BeautyService::getId, Function.identity()));
        if (serviceMap.size() != orderedServiceIds.size()) {
            throw new BusinessException(ErrorCode.BEAUTY_SERVICE_NOT_FOUND);
        }
        List<BeautyService> beautyServices = orderedServiceIds.stream()
                .map(serviceMap::get)
                .toList();
        int totalDurationMinutes = beautyServices.stream()
                .mapToInt(BeautyService::getDurationMinutes)
                .sum();
        Instant expectedEndAt = req.startAt().plusSeconds(totalDurationMinutes * 60L);

        Staff staff = staffRepository.findById(req.staffId())
                .orElseThrow(() -> new BusinessException(ErrorCode.STAFF_NOT_FOUND));

        // 메인 시술(첫 번째)만 디자이너 자격을 검증한다. 옵션 시술은 메인 디자이너가 함께 진행한다.
        Long mainServiceId = orderedServiceIds.get(0);
        boolean canPerformMain = staffServiceRepository
                .existsByStaffIdAndBeautyServiceIdAndActiveTrue(staff.getId(), mainServiceId);
        if (!canPerformMain) {
            throw new BusinessException(ErrorCode.STAFF_SERVICE_NOT_FOUND);
        }

        boolean conflict = !reservationRepository
                .findByStaffIdAndStartAtLessThanAndEndAtGreaterThanAndStatusIn(
                        staff.getId(), expectedEndAt, req.startAt(), ACTIVE_STATUSES)
                .isEmpty();
        if (conflict) {
            throw new BusinessException(ErrorCode.RESERVATION_TIME_UNAVAILABLE);
        }

        // 차단 시간(점심·휴무·교육 등) 검증: 시술 전체 시간이 차단 시간을 가로지르면 예약 불가
        if (overlapsAnyBlockedTime(staff.getId(), req.startAt(), expectedEndAt)) {
            throw new BusinessException(ErrorCode.RESERVATION_TIME_UNAVAILABLE);
        }

        Reservation reservation = Reservation.create(
                user,
                user.getUsername(),
                req.customerPhone(),
                staff,
                beautyServices,
                req.startAt(),
                expectedEndAt,
                ReservationStatus.REQUESTED,
                req.customerMemo(),
                null
        );
        Reservation saved = reservationRepository.save(reservation);
        try {
            notificationService.sendReservationRequested(saved);
        } catch (Exception e) {
            log.warn("예약 접수 메일 발송 실패 reservationId={}", saved.getId(), e);
        }
        return saved;
    }

    /**
     * 점심 시간(LUNCH)을 제외한 차단 시간(매장 휴무·디자이너 휴무·교육 등)이 시술 시간과 겹치는지 검사.
     * 점심은 가로지를 수 있는 정책이라 검증에서 제외한다.
     */
    private boolean overlapsAnyBlockedTime(Long staffId, Instant startAt, Instant endAt) {
        boolean oneTimeBlocked = blockedTimeRepository.findConflicting(staffId, startAt, endAt).stream()
                .anyMatch(bt -> bt.getBlockType() != BlockedTimeType.LUNCH);
        if (oneTimeBlocked) return true;

        DayOfWeek dayOfWeek = startAt.atZone(STORE_ZONE).getDayOfWeek();
        LocalDate date = startAt.atZone(STORE_ZONE).toLocalDate();
        return recurringBlockedTimeRepository.findByActiveTrue().stream()
                .filter(r -> r.getBlockType() != BlockedTimeType.LUNCH)
                .filter(r -> r.parseDaysOfWeek().contains(dayOfWeek))
                .filter(r -> r.getStaff() == null || r.getStaff().getId().equals(staffId))
                .anyMatch(r -> {
                    Instant rStart = date.atTime(r.getStartTime()).atZone(STORE_ZONE).toInstant();
                    Instant rEnd = date.atTime(r.getEndTime()).atZone(STORE_ZONE).toInstant();
                    return rStart.isBefore(endAt) && rEnd.isAfter(startAt);
                });
    }

    @Transactional(readOnly = true)
    public List<Reservation> findMyReservations(UserPrincipal principal) {
        return reservationRepository.findByCustomerIdOrderByStartAtDesc(principal.getId());
    }

    @Transactional(readOnly = true)
    public List<Reservation> findPending() {
        return reservationRepository.findPastUnprocessed(
                List.of(ReservationStatus.REQUESTED, ReservationStatus.CONFIRMED),
                Instant.now()
        );
    }

    @Transactional(readOnly = true)
    public List<Reservation> findUpcoming() {
        return reservationRepository.findAllActive(
                List.of(ReservationStatus.REQUESTED, ReservationStatus.CONFIRMED)
        );
    }

    @Transactional(readOnly = true)
    public List<Reservation> findByDate(LocalDate date) {
        Instant from = date.atStartOfDay(STORE_ZONE).toInstant();
        Instant to = date.plusDays(1).atStartOfDay(STORE_ZONE).toInstant();
        return reservationRepository.findByStartAtBetweenOrderByStartAtAsc(from, to);
    }

    @Transactional(readOnly = true)
    public List<Reservation> findAllRequested() {
        return reservationRepository.findAllActive(List.of(ReservationStatus.REQUESTED));
    }

    @Transactional
    public Reservation changeStatus(Long id, ChangeReservationStatusRequest req, UserPrincipal principal) {
        ReservationStatus status = req.status();
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESERVATION_NOT_FOUND));

        boolean isAdmin = "ROLE_ADMIN".equals(principal.getRoleCode())
                || "ROLE_MANAGER".equals(principal.getRoleCode());

        if (!isAdmin && !reservation.getCustomer().getId().equals(principal.getId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        reservation.changeStatus(status, req.adminMemo());
        Reservation saved = reservationRepository.save(reservation);
        try {
            if (status == ReservationStatus.CONFIRMED) {
                notificationService.sendReservationConfirmed(saved);
            } else if (status == ReservationStatus.CANCELLED_BY_CUSTOMER) {
                notificationService.sendReservationCancelledByCustomer(saved);
            } else if (status == ReservationStatus.CANCELLED_BY_ADMIN) {
                notificationService.sendReservationCancelledByAdmin(saved);
            }
        } catch (Exception e) {
            log.warn("예약 상태변경 메일 발송 실패 reservationId={} status={}", saved.getId(), status, e);
        }
        return saved;
    }

    private static final List<ReservationStatus> DELETABLE_STATUSES = List.of(
            ReservationStatus.REQUESTED,
            ReservationStatus.CANCELLED_BY_CUSTOMER,
            ReservationStatus.CANCELLED_BY_ADMIN,
            ReservationStatus.EXPIRED,
            ReservationStatus.COMPLETED,
            ReservationStatus.NO_SHOW
    );

    @Transactional
    public void softDelete(Long id, UserPrincipal principal) {
        Reservation reservation = reservationRepository.findActiveById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESERVATION_NOT_FOUND));

        boolean isAdmin = "ROLE_ADMIN".equals(principal.getRoleCode())
                || "ROLE_MANAGER".equals(principal.getRoleCode());

        if (!isAdmin && !reservation.getCustomer().getId().equals(principal.getId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        if (!DELETABLE_STATUSES.contains(reservation.getStatus())) {
            throw new BusinessException(ErrorCode.RESERVATION_INVALID_STATUS);
        }

        reservation.softDelete();
        reservationRepository.save(reservation);
    }

    @Transactional(readOnly = true)
    public List<Reservation> findAllDeleted() {
        return reservationRepository.findAllDeleted();
    }

    @Transactional(readOnly = true)
    public List<Reservation> findDeletedByDate(LocalDate date) {
        Instant from = date.atStartOfDay(STORE_ZONE).toInstant();
        Instant to = date.plusDays(1).atStartOfDay(STORE_ZONE).toInstant();
        return reservationRepository.findDeletedByDateRange(from, to);
    }
}
