package com.cj.twilio.callcenter.user.presentation.dto;

import com.cj.twilio.callcenter.user.domain.User;

public record UserSummary(Long id, String email, String username, String role) {
    public static UserSummary from(User u) {
        return new UserSummary(u.getId(), u.getEmail(), u.getUsername(), u.getRole().name());
    }
}
