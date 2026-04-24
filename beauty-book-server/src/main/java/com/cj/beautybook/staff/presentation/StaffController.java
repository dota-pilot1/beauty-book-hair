package com.cj.beautybook.staff.presentation;

import com.cj.beautybook.staff.application.StaffApplicationService;
import com.cj.beautybook.staff.presentation.dto.StaffResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "직원")
@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffController {

    private final StaffApplicationService staffApplicationService;

    @GetMapping
    public List<StaffResponse> list(@RequestParam(required = false) Long beautyServiceId) {
        return staffApplicationService.findDesigners(beautyServiceId)
                .stream()
                .map(StaffResponse::from)
                .toList();
    }
}
