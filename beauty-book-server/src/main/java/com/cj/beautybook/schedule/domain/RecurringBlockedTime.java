package com.cj.beautybook.schedule.domain;

import com.cj.beautybook.staff.domain.Staff;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "recurring_blocked_times")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecurringBlockedTime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private Staff staff;

    // Comma-separated DayOfWeek names, e.g. "MONDAY,TUESDAY,WEDNESDAY"
    @Column(nullable = false, length = 100)
    private String daysOfWeek;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BlockedTimeType blockType;

    @Column(length = 255)
    private String reason;

    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static RecurringBlockedTime create(
            Staff staff,
            Set<DayOfWeek> daysOfWeek,
            LocalTime startTime,
            LocalTime endTime,
            BlockedTimeType blockType,
            String reason
    ) {
        RecurringBlockedTime r = new RecurringBlockedTime();
        r.staff = staff;
        r.daysOfWeek = encodeDays(daysOfWeek);
        r.startTime = startTime;
        r.endTime = endTime;
        r.blockType = blockType;
        r.reason = reason;
        r.active = true;
        return r;
    }

    public Set<DayOfWeek> parseDaysOfWeek() {
        return Arrays.stream(daysOfWeek.split(","))
                .map(String::trim)
                .map(DayOfWeek::valueOf)
                .collect(Collectors.toSet());
    }

    private static String encodeDays(Set<DayOfWeek> days) {
        return days.stream()
                .map(DayOfWeek::name)
                .collect(Collectors.joining(","));
    }
}
