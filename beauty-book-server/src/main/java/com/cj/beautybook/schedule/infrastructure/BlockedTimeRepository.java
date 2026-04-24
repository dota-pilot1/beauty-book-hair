package com.cj.beautybook.schedule.infrastructure;

import com.cj.beautybook.schedule.domain.BlockedTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface BlockedTimeRepository extends JpaRepository<BlockedTime, Long> {
    List<BlockedTime> findByStartAtLessThanAndEndAtGreaterThan(Instant endAt, Instant startAt);

    List<BlockedTime> findByStaffIdAndStartAtLessThanAndEndAtGreaterThan(Long staffId, Instant endAt, Instant startAt);

    @Query("""
            select b from BlockedTime b
            where (:staffId is null or b.staff is null or b.staff.id = :staffId)
              and b.startAt < :endAt
              and b.endAt > :startAt
            order by b.startAt asc
            """)
    List<BlockedTime> findConflicting(
            @Param("staffId") Long staffId,
            @Param("startAt") Instant startAt,
            @Param("endAt") Instant endAt
    );

    @Query("""
            select b from BlockedTime b
            where (:staffId is null or b.staff.id = :staffId)
              and b.startAt >= :startAt
              and b.startAt < :endAt
            order by b.startAt asc
            """)
    List<BlockedTime> findWithin(
            @Param("staffId") Long staffId,
            @Param("startAt") Instant startAt,
            @Param("endAt") Instant endAt
    );
}
