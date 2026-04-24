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
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalTime;

@Entity
@Table(
        name = "staff_working_hours",
        uniqueConstraints = @UniqueConstraint(columnNames = {"staff_id", "day_of_week"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StaffWorkingHour {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "staff_id", nullable = false)
    private Staff staff;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DayOfWeek dayOfWeek;

    private LocalTime startTime;

    private LocalTime endTime;

    @Column(nullable = false)
    private boolean working;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static StaffWorkingHour create(
            Staff staff,
            DayOfWeek dayOfWeek,
            LocalTime startTime,
            LocalTime endTime,
            boolean working
    ) {
        StaffWorkingHour workingHour = new StaffWorkingHour();
        workingHour.staff = staff;
        workingHour.dayOfWeek = dayOfWeek;
        workingHour.startTime = startTime;
        workingHour.endTime = endTime;
        workingHour.working = working;
        return workingHour;
    }

    public void update(LocalTime startTime, LocalTime endTime, boolean working) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.working = working;
    }
}
