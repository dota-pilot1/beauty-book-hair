package com.cj.beautybook.user.presentation;

import com.cj.beautybook.auth.security.UserPrincipal;
import com.cj.beautybook.common.exception.BusinessException;
import com.cj.beautybook.common.exception.ErrorCode;
import com.cj.beautybook.user.application.AuthService;
import com.cj.beautybook.user.infrastructure.UserRepository;
import com.cj.beautybook.user.presentation.dto.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/signup")
    public ResponseEntity<SignupResponse> signup(@Valid @RequestBody SignupRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.signup(req));
    }

    @GetMapping("/check-email")
    public ResponseEntity<CheckEmailResponse> checkEmail(
            @RequestParam @Email(message = "올바른 이메일 형식이 아닙니다.") String email
    ) {
        return ResponseEntity.ok(new CheckEmailResponse(authService.isEmailAvailable(email)));
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshRequest req) {
        return ResponseEntity.ok(authService.refresh(req));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal UserPrincipal principal) {
        authService.logout(principal.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserSummary> me(@AuthenticationPrincipal UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .map(UserSummary::from)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    @PatchMapping("/me/profile-image")
    public ResponseEntity<UserSummary> updateProfileImage(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileImageRequest req
    ) {
        return ResponseEntity.ok(authService.updateProfileImage(principal.getId(), req));
    }
}
