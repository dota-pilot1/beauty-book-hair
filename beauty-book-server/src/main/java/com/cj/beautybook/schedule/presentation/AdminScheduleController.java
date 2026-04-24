package com.cj.beautybook.schedule.presentation;

import com.cj.beautybook.schedule.application.ScheduleService;
import com.cj.beautybook.schedule.presentation.dto.BlockedTimeResponse;
import com.cj.beautybook.schedule.presentation.dto.BusinessHourResponse;
import com.cj.beautybook.schedule.presentation.dto.CreateBlockedTimeRequest;
import com.cj.beautybook.schedule.presentation.dto.StaffWorkingHourResponse;
import com.cj.beautybook.schedule.presentation.dto.UpdateBlockedTimeRequest;
import com.cj.beautybook.schedule.presentation.dto.UpdateBusinessHoursRequest;
import com.cj.beautybook.schedule.presentation.dto.UpdateStaffWorkingHoursRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@Tag(name = "관리자 스케쥴 관리")
@RestController
@RequestMapping("/api/admin/schedules")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminScheduleController {

    private final ScheduleService scheduleService;

    @GetMapping("/business-hours")
    public List<BusinessHourResponse> listBusinessHours() {
        return scheduleService.findBusinessHours()
                .stream()
                .map(BusinessHourResponse::from)
                .toList();
    }

    @PutMapping("/business-hours")
    public List<BusinessHourResponse> replaceBusinessHours(@Valid @RequestBody UpdateBusinessHoursRequest request) {
        return scheduleService.replaceBusinessHours(request)
                .stream()
                .map(BusinessHourResponse::from)
                .toList();
    }

    @GetMapping("/staff/{staffId}/working-hours")
    public List<StaffWorkingHourResponse> listStaffWorkingHours(@PathVariable Long staffId) {
        return scheduleService.findStaffWorkingHours(staffId)
                .stream()
                .map(StaffWorkingHourResponse::from)
                .toList();
    }

    @PutMapping("/staff/{staffId}/working-hours")
    public List<StaffWorkingHourResponse> replaceStaffWorkingHours(
            @PathVariable Long staffId,
            @Valid @RequestBody UpdateStaffWorkingHoursRequest request
    ) {
        return scheduleService.replaceStaffWorkingHours(staffId, request)
                .stream()
                .map(StaffWorkingHourResponse::from)
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

    @PostMapping("/blocked-times")
    @ResponseStatus(HttpStatus.CREATED)
    public BlockedTimeResponse createBlockedTime(@Valid @RequestBody CreateBlockedTimeRequest request) {
        return BlockedTimeResponse.from(scheduleService.createBlockedTime(request));
    }

    @PatchMapping("/blocked-times/{blockedTimeId}")
    public BlockedTimeResponse updateBlockedTime(
            @PathVariable Long blockedTimeId,
            @Valid @RequestBody UpdateBlockedTimeRequest request
    ) {
        return BlockedTimeResponse.from(scheduleService.updateBlockedTime(blockedTimeId, request));
    }

    @DeleteMapping("/blocked-times/{blockedTimeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBlockedTime(@PathVariable Long blockedTimeId) {
        scheduleService.deleteBlockedTime(blockedTimeId);
    }
}
