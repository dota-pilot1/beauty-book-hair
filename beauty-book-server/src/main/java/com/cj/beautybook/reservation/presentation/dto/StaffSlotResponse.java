package com.cj.beautybook.reservation.presentation.dto;

public record StaffSlotResponse(
        String startAt,
        String endAt,
        String status,    // AVAILABLE | BOOKED | OFF_DUTY | BLOCKED | PAST
        String blockType, // LUNCH | STORE_CLOSED | DESIGNER_OFF | EDUCATION | PERSONAL | ETC (nullable)
        String reason     // 차단 사유 (nullable)
) {}
