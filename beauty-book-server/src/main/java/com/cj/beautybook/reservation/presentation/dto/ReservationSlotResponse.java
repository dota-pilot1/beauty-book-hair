package com.cj.beautybook.reservation.presentation.dto;

import com.cj.beautybook.reservation.application.ReservationSlotStatus;

import java.time.Instant;
import java.util.List;

public record ReservationSlotResponse(
        String slotId,
        Instant startAt,
        Instant endAt,
        Integer durationMinutes,
        Integer unitMinutes,
        Integer occupiedUnitCount,
        ReservationSlotStatus status,
        boolean selectable,
        List<AvailableStaffResponse> availableStaff,
        String reason,
        String notice
) {
}
