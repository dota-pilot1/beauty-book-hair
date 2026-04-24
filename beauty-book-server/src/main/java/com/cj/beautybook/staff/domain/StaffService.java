package com.cj.beautybook.staff.domain;

import com.cj.beautybook.beauty_service.domain.BeautyService;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

import java.time.Instant;

@Entity
@Table(
        name = "staff_services",
        uniqueConstraints = @UniqueConstraint(columnNames = {"staff_id", "beauty_service_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StaffService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "staff_id", nullable = false)
    private Staff staff;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "beauty_service_id", nullable = false)
    private BeautyService beautyService;

    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static StaffService create(Staff staff, BeautyService beautyService, boolean active) {
        StaffService staffService = new StaffService();
        staffService.staff = staff;
        staffService.beautyService = beautyService;
        staffService.active = active;
        return staffService;
    }

    public void updateActive(boolean active) {
        this.active = active;
    }
}
