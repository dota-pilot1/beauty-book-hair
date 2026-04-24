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

import java.time.Instant;

@Entity
@Table(name = "blocked_times")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BlockedTime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private Staff staff;

    @Column(nullable = false)
    private Instant startAt;

    @Column(nullable = false)
    private Instant endAt;

    @Column(length = 255)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BlockedTimeType blockType;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static BlockedTime create(
            Staff staff,
            Instant startAt,
            Instant endAt,
            String reason,
            BlockedTimeType blockType
    ) {
        BlockedTime blockedTime = new BlockedTime();
        blockedTime.staff = staff;
        blockedTime.startAt = startAt;
        blockedTime.endAt = endAt;
        blockedTime.reason = reason;
        blockedTime.blockType = blockType;
        return blockedTime;
    }

    public void update(Staff staff, Instant startAt, Instant endAt, String reason, BlockedTimeType blockType) {
        this.staff = staff;
        this.startAt = startAt;
        this.endAt = endAt;
        this.reason = reason;
        this.blockType = blockType;
    }
}
