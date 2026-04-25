package com.cj.beautybook.reservation.infrastructure;

import com.cj.beautybook.reservation.domain.Reservation;
import com.cj.beautybook.reservation.domain.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByStaffIdAndStartAtLessThanAndEndAtGreaterThanAndStatusIn(
            Long staffId,
            Instant endAt,
            Instant startAt,
            Collection<ReservationStatus> statuses
    );

    List<Reservation> findByCustomerPhoneOrderByStartAtDesc(String customerPhone);

    List<Reservation> findByCustomerIdOrderByStartAtDesc(Long customerId);

    List<Reservation> findByStartAtBetweenOrderByStartAtAsc(Instant from, Instant to);

    // @SQLRestriction을 우회하기 위해 네이티브 쿼리 사용
    @Query(value = "SELECT * FROM reservations WHERE start_at >= :from AND start_at < :to AND deleted_at IS NOT NULL ORDER BY start_at ASC", nativeQuery = true)
    List<Reservation> findDeletedByStartAtBetween(@Param("from") Instant from, @Param("to") Instant to);
}
