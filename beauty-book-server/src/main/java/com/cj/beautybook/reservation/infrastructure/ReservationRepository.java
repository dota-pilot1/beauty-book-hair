package com.cj.beautybook.reservation.infrastructure;

import com.cj.beautybook.reservation.domain.Reservation;
import com.cj.beautybook.reservation.domain.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
