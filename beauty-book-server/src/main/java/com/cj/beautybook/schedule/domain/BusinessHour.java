package com.cj.beautybook.schedule.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalTime;

@Entity
@Table(name = "business_hours")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BusinessHour {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 20)
    private DayOfWeek dayOfWeek;

    private LocalTime openTime;

    private LocalTime closeTime;

    @Column(nullable = false)
    private boolean closed;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static BusinessHour create(DayOfWeek dayOfWeek, LocalTime openTime, LocalTime closeTime, boolean closed) {
        BusinessHour businessHour = new BusinessHour();
        businessHour.dayOfWeek = dayOfWeek;
        businessHour.openTime = openTime;
        businessHour.closeTime = closeTime;
        businessHour.closed = closed;
        return businessHour;
    }

    public void update(LocalTime openTime, LocalTime closeTime, boolean closed) {
        this.openTime = openTime;
        this.closeTime = closeTime;
        this.closed = closed;
    }
}
