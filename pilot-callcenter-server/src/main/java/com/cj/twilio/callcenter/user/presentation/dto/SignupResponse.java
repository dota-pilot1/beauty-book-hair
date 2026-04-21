package com.cj.twilio.callcenter.user.presentation.dto;

import com.cj.twilio.callcenter.user.domain.User;

import java.time.Instant;

public record SignupResponse(
        Long id,
        String email,
        String username,
        String role,
        Instant createdAt
) {
    public static SignupResponse from(User u) {
        return new SignupResponse(u.getId(), u.getEmail(), u.getUsername(), u.getRole().name(), u.getCreatedAt());
    }
}
