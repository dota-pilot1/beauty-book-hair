package com.cj.beautybook.site_settings.presentation.dto;

import com.cj.beautybook.site_settings.domain.SiteSetting;

import java.time.Instant;
import java.util.List;

public record MailSettingResponse(
        List<String> reservationRequestEmails,
        Instant updatedAt
) {
    public static MailSettingResponse from(SiteSetting s) {
        return new MailSettingResponse(
                s.getReservationRequestEmails(),
                s.getUpdatedAt()
        );
    }
}
