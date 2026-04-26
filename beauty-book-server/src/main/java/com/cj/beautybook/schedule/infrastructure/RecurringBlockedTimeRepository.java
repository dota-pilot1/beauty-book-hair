package com.cj.beautybook.schedule.infrastructure;

import com.cj.beautybook.schedule.domain.RecurringBlockedTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RecurringBlockedTimeRepository extends JpaRepository<RecurringBlockedTime, Long> {

    List<RecurringBlockedTime> findByActiveTrue();

    @Query("SELECT r FROM RecurringBlockedTime r WHERE r.active = true AND (r.staff IS NULL OR r.staff.id = :staffId)")
    List<RecurringBlockedTime> findActiveForStaff(@Param("staffId") Long staffId);
}
