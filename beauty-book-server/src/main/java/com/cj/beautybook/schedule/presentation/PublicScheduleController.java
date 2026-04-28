package com.cj.beautybook.schedule.presentation;

import com.cj.beautybook.reservation.application.ReservationSlotService;
import com.cj.beautybook.reservation.presentation.dto.StaffSlotResponse;
import com.cj.beautybook.schedule.application.ScheduleService;
import com.cj.beautybook.schedule.domain.StaffWorkingHour;
import com.cj.beautybook.schedule.presentation.dto.BlockedTimeResponse;
import com.cj.beautybook.schedule.presentation.dto.BusinessHourResponse;
import com.cj.beautybook.schedule.presentation.dto.RecurringBlockedTimeResponse;
import com.cj.beautybook.schedule.presentation.dto.StaffScheduleResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class PublicScheduleController {

    private final ScheduleService scheduleService;
    private final ReservationSlotService reservationSlotService;

    @GetMapping("/business-hours")
    public List<BusinessHourResponse> listBusinessHours() {
        return scheduleService.findBusinessHours()
                .stream()
                .map(BusinessHourResponse::from)
                .toList();
    }

    @GetMapping("/blocked-times")
    public List<BlockedTimeResponse> listBlockedTimes(
            @RequestParam(required = false) Long staffId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startAt,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endAt
    ) {
        return scheduleService.findBlockedTimes(staffId, startAt, endAt)
                .stream()
                .map(BlockedTimeResponse::from)
                .toList();
    }

    @GetMapping("/recurring-blocked-times")
    public List<RecurringBlockedTimeResponse> listRecurringBlockedTimes() {
        return scheduleService.findRecurringBlockedTimes()
                .stream()
                .map(RecurringBlockedTimeResponse::from)
                .toList();
    }

    @GetMapping("/staff-slots")
    public List<StaffSlotResponse> listStaffSlots(
            @RequestParam Long staffId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return reservationSlotService.findStaffAvailability(staffId, date);
    }

    @GetMapping("/staff-working-hours")
    public List<StaffScheduleResponse> listStaffWorkingHours() {
        List<StaffWorkingHour> all = scheduleService.findAllStaffWorkingHours();
        Map<Long, List<StaffWorkingHour>> byStaff = all.stream()
                .collect(Collectors.groupingBy(h -> h.getStaff().getId(), Collectors.toList()));

        return all.stream()
                .map(h -> h.getStaff())
                .distinct()
                .map(staff -> new StaffScheduleResponse(
                        staff.getId(),
                        staff.getName(),
                        staff.getProfileImageUrl(),
                        byStaff.getOrDefault(staff.getId(), List.of()).stream()
                                .map(StaffScheduleResponse.WorkingDay::from)
                                .toList()
                ))
                .toList();
    }
}
