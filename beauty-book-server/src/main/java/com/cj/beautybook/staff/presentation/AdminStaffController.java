package com.cj.beautybook.staff.presentation;

import com.cj.beautybook.staff.application.StaffApplicationService;
import com.cj.beautybook.staff.presentation.dto.CreateStaffRequest;
import com.cj.beautybook.staff.presentation.dto.StaffResponse;
import com.cj.beautybook.staff.presentation.dto.StaffServiceResponse;
import com.cj.beautybook.staff.presentation.dto.UpdateStaffRequest;
import com.cj.beautybook.staff.presentation.dto.UpdateStaffServicesRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "관리자 직원 관리")
@RestController
@RequestMapping("/api/admin/staff")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminStaffController {

    private final StaffApplicationService staffApplicationService;

    @GetMapping
    public List<StaffResponse> list() {
        return staffApplicationService.findAllForAdmin()
                .stream()
                .map(StaffResponse::from)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StaffResponse create(@Valid @RequestBody CreateStaffRequest request) {
        return StaffResponse.from(staffApplicationService.create(request));
    }

    @PatchMapping("/{staffId}")
    public StaffResponse update(
            @PathVariable Long staffId,
            @Valid @RequestBody UpdateStaffRequest request
    ) {
        return StaffResponse.from(staffApplicationService.update(staffId, request));
    }

    @GetMapping("/{staffId}/services")
    public List<StaffServiceResponse> listServices(@PathVariable Long staffId) {
        return staffApplicationService.findStaffServices(staffId)
                .stream()
                .map(StaffServiceResponse::from)
                .toList();
    }

    @PutMapping("/{staffId}/services")
    public List<StaffServiceResponse> replaceServices(
            @PathVariable Long staffId,
            @Valid @RequestBody UpdateStaffServicesRequest request
    ) {
        return staffApplicationService.replaceStaffServices(staffId, request.beautyServiceIds())
                .stream()
                .map(StaffServiceResponse::from)
                .toList();
    }
}
