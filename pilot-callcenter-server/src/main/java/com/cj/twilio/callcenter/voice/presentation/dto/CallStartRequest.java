package com.cj.twilio.callcenter.voice.presentation.dto;

public record CallStartRequest(
        String contactId,
        String fromNumber,
        String toNumber
) {}
