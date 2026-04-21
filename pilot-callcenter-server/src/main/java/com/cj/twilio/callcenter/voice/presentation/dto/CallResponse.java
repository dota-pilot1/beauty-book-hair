package com.cj.twilio.callcenter.voice.presentation.dto;

import com.cj.twilio.callcenter.voice.domain.Call;
import com.cj.twilio.callcenter.voice.domain.CallStatus;

import java.time.LocalDateTime;

public record CallResponse(
        Long id,
        String callSid,
        String fromNumber,
        String toNumber,
        CallStatus status,
        LocalDateTime startedAt,
        LocalDateTime endedAt,
        Integer durationSec
) {
    public static CallResponse from(Call call) {
        return new CallResponse(
                call.getId(),
                call.getCallSid(),
                call.getFromNumber(),
                call.getToNumber(),
                call.getStatus(),
                call.getStartedAt(),
                call.getEndedAt(),
                call.getDurationSec()
        );
    }
}
