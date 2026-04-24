package com.cj.beautybook.schedule.infrastructure;

import com.cj.beautybook.schedule.domain.StaffWorkingHour;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

public interface StaffWorkingHourRepository extends JpaRepository<StaffWorkingHour, Long> {
    Optional<StaffWorkingHour> findByStaffIdAndDayOfWeek(Long staffId, DayOfWeek dayOfWeek);

    List<StaffWorkingHour> findByStaffIdOrderByDayOfWeekAsc(Long staffId);
}
