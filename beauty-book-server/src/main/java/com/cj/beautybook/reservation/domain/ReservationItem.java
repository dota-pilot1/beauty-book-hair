package com.cj.beautybook.reservation.domain;

import com.cj.beautybook.beauty_service.domain.BeautyService;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(
        name = "reservation_items",
        indexes = {
                @Index(name = "idx_reservation_items_reservation_id", columnList = "reservation_id"),
                @Index(name = "idx_reservation_items_beauty_service_id", columnList = "beauty_service_id")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ReservationItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "beauty_service_id", nullable = false)
    private BeautyService beautyService;

    @Column(nullable = false, length = 120)
    private String beautyServiceName;

    @Column(nullable = false)
    private Integer durationMinutes;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer displayOrder;

    static ReservationItem create(
            Reservation reservation,
            BeautyService beautyService,
            int displayOrder
    ) {
        ReservationItem item = new ReservationItem();
        item.reservation = reservation;
        item.beautyService = beautyService;
        item.beautyServiceName = beautyService.getName();
        item.durationMinutes = beautyService.getDurationMinutes();
        item.price = beautyService.getPrice();
        item.displayOrder = displayOrder;
        return item;
    }
}
