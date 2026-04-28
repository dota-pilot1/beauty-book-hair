package com.cj.beautybook.reservation.application;

import com.cj.beautybook.notification.application.NotificationService;
import com.cj.beautybook.reservation.domain.Reservation;
import com.cj.beautybook.reservation.domain.ReservationStatus;
import com.cj.beautybook.reservation.infrastructure.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * REQUESTED 상태로 일정 시간 이상 머문 예약을 EXPIRED 로 자동 취소한다.
 *
 * 동시성:
 *  - 만료 대상 ID 만 별도 트랜잭션에서 조회 (read-only)
 *  - 각 ID 마다 독립 트랜잭션 (REQUIRES_NEW) 으로 상태 재확인 후 변경
 *  - 관리자가 동시에 확정/취소하더라도 트랜잭션 내 재조회로 race 방지
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReservationExpiryService {

    private static final String EXPIRY_MEMO = "[자동] 1시간 내 미확정으로 자동 취소되었습니다.";

    private final ReservationRepository reservationRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<Long> findExpirableIds(Duration after) {
        Instant threshold = Instant.now().minus(after);
        return reservationRepository.findExpirableRequestIds(ReservationStatus.REQUESTED, threshold);
    }

    public int expireOldRequests(Duration after) {
        List<Long> ids = findExpirableIds(after);
        int expired = 0;
        for (Long id : ids) {
            try {
                if (expireOne(id)) expired++;
            } catch (Exception e) {
                log.error("예약 자동 만료 처리 실패 reservationId={}", id, e);
            }
        }
        return expired;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean expireOne(Long id) {
        Reservation r = reservationRepository.findById(id).orElse(null);
        if (r == null) return false;
        if (r.getStatus() != ReservationStatus.REQUESTED) return false;

        r.changeStatus(ReservationStatus.EXPIRED, EXPIRY_MEMO);
        Reservation saved = reservationRepository.save(r);
        log.info("예약 자동 만료 reservationId={} customerId={} createdAt={}",
                saved.getId(),
                saved.getCustomer() != null ? saved.getCustomer().getId() : null,
                saved.getCreatedAt());

        try {
            notificationService.sendReservationExpired(saved);
        } catch (Exception e) {
            log.warn("예약 자동 만료 메일 발송 실패 reservationId={}", id, e);
        }
        return true;
    }
}
