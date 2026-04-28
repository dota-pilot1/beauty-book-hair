package com.cj.beautybook.reservation.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * 예약 요청 자동 만료 스케쥴러.
 *
 * 1분마다 REQUESTED 상태가 1시간 이상 경과한 예약을 EXPIRED 로 변경한다.
 * - 만료 임계: 1시간
 * - 점검 주기: 1분
 *
 * 단일 인스턴스 운영 기준. 다중 인스턴스 도입 시 ShedLock 등으로 중복 실행 방지 필요.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReservationExpiryScheduler {

    private static final Duration EXPIRY_AFTER = Duration.ofHours(1);

    private final ReservationExpiryService expiryService;

    @Scheduled(fixedDelay = 60_000L, initialDelay = 30_000L)
    public void run() {
        try {
            int expired = expiryService.expireOldRequests(EXPIRY_AFTER);
            if (expired > 0) {
                log.info("자동 만료된 예약 요청 {}건", expired);
            }
        } catch (Exception e) {
            log.error("예약 요청 자동 만료 스케쥴러 실패", e);
        }
    }
}
