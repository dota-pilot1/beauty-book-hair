package com.cj.beautybook.reservation.domain;

import com.cj.beautybook.beauty_service.domain.BeautyService;
import com.cj.beautybook.staff.domain.Staff;
import com.cj.beautybook.user.domain.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@SQLRestriction("deleted_at IS NULL")
@Table(
        name = "reservations",
        indexes = {
                @Index(name = "idx_reservations_staff_start_at", columnList = "staff_id,start_at"),
                @Index(name = "idx_reservations_staff_end_at", columnList = "staff_id,end_at"),
                @Index(name = "idx_reservations_status", columnList = "status"),
                @Index(name = "idx_reservations_customer_phone", columnList = "customer_phone")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private User customer;

    @Column(nullable = false, length = 80)
    private String customerName;

    @Column(nullable = false, length = 30)
    private String customerPhone;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "staff_id", nullable = false)
    private Staff staff;

    /**
     * 대표 시술. 다중 시술 도입 이전 row 호환과 빠른 조회를 위해 유지하며,
     * 신규 예약에서는 항상 items[0]의 시술과 동일하다.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "beauty_service_id", nullable = false)
    private BeautyService beautyService;

    @OneToMany(mappedBy = "reservation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC, id ASC")
    private List<ReservationItem> items = new ArrayList<>();

    @Column(nullable = false)
    private Instant startAt;

    @Column(nullable = false)
    private Instant endAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReservationStatus status;

    @Column(length = 1000)
    private String customerMemo;

    @Column(length = 1000)
    private String adminMemo;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    @Column
    private Instant deletedAt;

    public static Reservation create(
            User customer,
            String customerName,
            String customerPhone,
            Staff staff,
            List<BeautyService> beautyServices,
            Instant startAt,
            Instant endAt,
            ReservationStatus status,
            String customerMemo,
            String adminMemo
    ) {
        if (beautyServices == null || beautyServices.isEmpty()) {
            throw new IllegalArgumentException("beautyServices must not be empty");
        }
        Reservation reservation = new Reservation();
        reservation.customer = customer;
        reservation.customerName = customerName;
        reservation.customerPhone = customerPhone;
        reservation.staff = staff;
        reservation.beautyService = beautyServices.get(0);
        reservation.startAt = startAt;
        reservation.endAt = endAt;
        reservation.status = status;
        reservation.customerMemo = customerMemo;
        reservation.adminMemo = adminMemo;
        for (int i = 0; i < beautyServices.size(); i++) {
            reservation.items.add(ReservationItem.create(reservation, beautyServices.get(i), i));
        }
        return reservation;
    }

    public void changeStatus(ReservationStatus status, String adminMemo) {
        this.status = status;
        if (adminMemo != null) this.adminMemo = adminMemo;
    }

    public void softDelete() {
        this.deletedAt = Instant.now();
    }
}
