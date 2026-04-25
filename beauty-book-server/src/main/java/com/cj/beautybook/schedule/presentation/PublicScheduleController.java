package com.cj.beautybook.schedule.presentation;

import com.cj.beautybook.schedule.application.ScheduleService;
import com.cj.beautybook.schedule.presentation.dto.BusinessHourResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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
}
