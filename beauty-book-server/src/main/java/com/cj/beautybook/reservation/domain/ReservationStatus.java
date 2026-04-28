package com.cj.beautybook.reservation.domain;

public enum ReservationStatus {
    REQUESTED,
    CONFIRMED,
    CANCELLED_BY_CUSTOMER,
    CANCELLED_BY_ADMIN,
    EXPIRED,
    COMPLETED,
    NO_SHOW
}
