package com.cj.beautybook.site_settings.presentation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateMailSettingRequest(
        @Size(max = 10, message = "이메일은 최대 10개까지 등록할 수 있습니다.")
        List<@Email(message = "올바른 이메일 형식이 아닙니다.") @Size(max = 255) String> reservationRequestEmails
) {}
