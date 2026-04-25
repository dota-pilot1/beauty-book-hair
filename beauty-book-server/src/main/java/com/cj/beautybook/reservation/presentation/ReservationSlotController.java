package com.cj.beautybook.reservation.presentation;

import com.cj.beautybook.reservation.application.ReservationSlotService;
import com.cj.beautybook.reservation.presentation.dto.ReservationSlotResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@Tag(name = "예약 슬롯")
@RestController
@RequestMapping("/api/reservation-slots")
@RequiredArgsConstructor
public class ReservationSlotController {

    private final ReservationSlotService reservationSlotService;

    @GetMapping
    public List<ReservationSlotResponse> list(
            @RequestParam(name = "beautyServiceIds") List<Long> beautyServiceIds,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long staffId
    ) {
        return reservationSlotService.findSlots(beautyServiceIds, date, staffId);
    }
}
