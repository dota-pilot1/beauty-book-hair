package com.cj.beautybook.reservation.presentation;

import com.cj.beautybook.auth.security.UserPrincipal;
import com.cj.beautybook.common.exception.BusinessException;
import com.cj.beautybook.common.exception.ErrorCode;
import com.cj.beautybook.reservation.application.ReservationService;
import com.cj.beautybook.reservation.domain.Reservation;
import com.cj.beautybook.reservation.domain.ReservationStatus;
import com.cj.beautybook.reservation.presentation.dto.ChangeReservationStatusRequest;
import com.cj.beautybook.reservation.presentation.dto.CreateReservationRequest;
import com.cj.beautybook.reservation.presentation.dto.ReservationResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@Tag(name = "예약")
@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationResponse create(
            @Valid @RequestBody CreateReservationRequest req,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ReservationResponse.from(reservationService.create(req, principal));
    }

    @GetMapping("/me")
    public List<ReservationResponse> myReservations(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return reservationService.findMyReservations(principal)
                .stream()
                .map(ReservationResponse::from)
                .toList();
    }

    @GetMapping("/pending")
    public List<ReservationResponse> listPending(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        boolean isAdmin = "ROLE_ADMIN".equals(principal.getRoleCode())
                || "ROLE_MANAGER".equals(principal.getRoleCode());
        if (!isAdmin) throw new BusinessException(ErrorCode.FORBIDDEN);
        return reservationService.findPending()
                .stream()
                .map(r -> ReservationResponse.from(r, true))
                .toList();
    }

    @GetMapping("/upcoming")
    public List<ReservationResponse> listUpcoming(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        boolean isAdmin = "ROLE_ADMIN".equals(principal.getRoleCode())
                || "ROLE_MANAGER".equals(principal.getRoleCode());
        if (!isAdmin) throw new BusinessException(ErrorCode.FORBIDDEN);
        return reservationService.findUpcoming()
                .stream()
                .map(r -> ReservationResponse.from(r, true))
                .toList();
    }

    @GetMapping
    public List<ReservationResponse> listByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        boolean isAdmin = "ROLE_ADMIN".equals(principal.getRoleCode())
                || "ROLE_MANAGER".equals(principal.getRoleCode());
        return reservationService.findByDate(date)
                .stream()
                .map(r -> ReservationResponse.from(r, isAdmin))
                .toList();
    }

    @PatchMapping("/{id}/status")
    public ReservationResponse changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody ChangeReservationStatusRequest req,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ReservationResponse.from(
                reservationService.changeStatus(id, req, principal)
        );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        reservationService.softDelete(id, principal);
    }

    @GetMapping("/deleted")
    public List<ReservationResponse> listDeleted(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        boolean isAdmin = "ROLE_ADMIN".equals(principal.getRoleCode())
                || "ROLE_MANAGER".equals(principal.getRoleCode());
        if (!isAdmin) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        List<Reservation> results = date != null
                ? reservationService.findDeletedByDate(date)
                : reservationService.findAllDeleted();
        return results.stream()
                .map(ReservationResponse::from)
                .toList();
    }
}
