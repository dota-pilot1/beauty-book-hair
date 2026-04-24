package com.cj.beautybook.schedule.infrastructure;

import com.cj.beautybook.schedule.domain.BusinessHour;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.DayOfWeek;
import java.util.Optional;

public interface BusinessHourRepository extends JpaRepository<BusinessHour, Long> {
    Optional<BusinessHour> findByDayOfWeek(DayOfWeek dayOfWeek);
}
