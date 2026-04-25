package com.cj.beautybook.reservation.infrastructure;

import com.cj.beautybook.reservation.domain.Reservation;
import com.cj.beautybook.reservation.domain.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

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

    @Query("SELECT r FROM Reservation r WHERE r.deletedAt IS NOT NULL ORDER BY r.deletedAt DESC")
    List<Reservation> findAllDeleted();

    @Query("SELECT r FROM Reservation r WHERE r.deletedAt IS NOT NULL AND r.startAt >= :from AND r.startAt < :to ORDER BY r.deletedAt DESC")
    List<Reservation> findDeletedByDateRange(@Param("from") Instant from, @Param("to") Instant to);

    @Query("SELECT r FROM Reservation r WHERE r.id = :id AND r.deletedAt IS NULL")
    Optional<Reservation> findActiveById(@Param("id") Long id);
}
