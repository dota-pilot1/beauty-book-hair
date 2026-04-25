package com.cj.beautybook.reservation.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;

public record CreateReservationRequest(
        @NotEmpty List<@NotNull Long> beautyServiceIds,
        @NotNull Long staffId,
        @NotNull Instant startAt,
        @NotNull Instant endAt,
        @NotBlank String customerPhone,
        String customerMemo
) {}
