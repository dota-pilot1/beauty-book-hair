package com.cj.beautybook.reservation.application;

import com.cj.beautybook.auth.security.UserPrincipal;
import com.cj.beautybook.beauty_service.domain.BeautyService;
import com.cj.beautybook.beauty_service.infrastructure.BeautyServiceRepository;
import com.cj.beautybook.common.exception.BusinessException;
import com.cj.beautybook.common.exception.ErrorCode;
import com.cj.beautybook.reservation.domain.Reservation;
import com.cj.beautybook.reservation.domain.ReservationStatus;
import com.cj.beautybook.reservation.infrastructure.ReservationRepository;
import com.cj.beautybook.reservation.presentation.dto.CreateReservationRequest;
import com.cj.beautybook.staff.domain.Staff;
import com.cj.beautybook.staff.infrastructure.StaffRepository;
import com.cj.beautybook.user.domain.User;
import com.cj.beautybook.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

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
    private final UserRepository userRepository;

    @Transactional
    public Reservation create(CreateReservationRequest req, UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        BeautyService beautyService = beautyServiceRepository.findById(req.beautyServiceId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BEAUTY_SERVICE_NOT_FOUND));

        Staff staff = staffRepository.findById(req.staffId())
                .orElseThrow(() -> new BusinessException(ErrorCode.STAFF_NOT_FOUND));

        boolean conflict = !reservationRepository
                .findByStaffIdAndStartAtLessThanAndEndAtGreaterThanAndStatusIn(
                        staff.getId(), req.endAt(), req.startAt(), ACTIVE_STATUSES)
                .isEmpty();
        if (conflict) {
            throw new BusinessException(ErrorCode.RESERVATION_TIME_UNAVAILABLE);
        }

        Reservation reservation = Reservation.create(
                user,
                user.getUsername(),
                req.customerPhone(),
                staff,
                beautyService,
                req.startAt(),
                req.endAt(),
                ReservationStatus.REQUESTED,
                req.customerMemo(),
                null
        );
        return reservationRepository.save(reservation);
    }

    @Transactional(readOnly = true)
    public List<Reservation> findMyReservations(UserPrincipal principal) {
        return reservationRepository.findByCustomerIdOrderByStartAtDesc(principal.getId());
    }

    @Transactional(readOnly = true)
    public List<Reservation> findByDate(LocalDate date) {
        Instant from = date.atStartOfDay(STORE_ZONE).toInstant();
        Instant to = date.plusDays(1).atStartOfDay(STORE_ZONE).toInstant();
        return reservationRepository.findByStartAtBetweenOrderByStartAtAsc(from, to);
    }

    @Transactional
    public Reservation changeStatus(Long id, ReservationStatus status, UserPrincipal principal) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESERVATION_NOT_FOUND));

        boolean isAdmin = "ROLE_ADMIN".equals(principal.getRoleCode())
                || "ROLE_MANAGER".equals(principal.getRoleCode());

        if (!isAdmin && !reservation.getCustomer().getId().equals(principal.getId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        reservation.changeStatus(status);
        return reservationRepository.save(reservation);
    }
}
