package com.cj.beautybook.schedule.presentation;

import com.cj.beautybook.schedule.application.ScheduleService;
import com.cj.beautybook.schedule.domain.StaffWorkingHour;
import com.cj.beautybook.schedule.presentation.dto.BusinessHourResponse;
import com.cj.beautybook.schedule.presentation.dto.StaffScheduleResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class PublicScheduleController {

    private final ScheduleService scheduleService;

    @GetMapping("/business-hours")
    public List<BusinessHourResponse> listBusinessHours() {
        return scheduleService.findBusinessHours()
                .stream()
                .map(BusinessHourResponse::from)
                .toList();
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
