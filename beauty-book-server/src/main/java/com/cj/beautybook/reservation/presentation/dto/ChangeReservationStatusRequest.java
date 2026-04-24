package com.cj.beautybook.reservation.presentation.dto;

import com.cj.beautybook.reservation.domain.ReservationStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeReservationStatusRequest(
        @NotNull ReservationStatus status
) {}
