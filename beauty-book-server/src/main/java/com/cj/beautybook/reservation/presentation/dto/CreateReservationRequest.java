package com.cj.beautybook.reservation.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record CreateReservationRequest(
        @NotNull Long beautyServiceId,
        @NotNull Long staffId,
        @NotNull Instant startAt,
        @NotNull Instant endAt,
        @NotBlank String customerPhone,
        String customerMemo
) {}
