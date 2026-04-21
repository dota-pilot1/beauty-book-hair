package com.cj.twilio.callcenter.voice.application;

import com.cj.twilio.callcenter.voice.domain.Call;
import com.cj.twilio.callcenter.voice.domain.CallRepository;
import com.cj.twilio.callcenter.voice.domain.CallStatus;
import com.cj.twilio.callcenter.voice.presentation.dto.CallEndRequest;
import com.cj.twilio.callcenter.voice.presentation.dto.CallResponse;
import com.cj.twilio.callcenter.voice.presentation.dto.CallStartRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class VoiceService {

    private final CallRepository callRepository;

    public VoiceService(CallRepository callRepository) {
        this.callRepository = callRepository;
    }

    @Transactional
    public CallResponse startCall(CallStartRequest request) {
        String callSid = (request.contactId() != null && !request.contactId().isBlank())
                ? request.contactId()
                : UUID.randomUUID().toString();
        Call call = Call.createInbound(callSid, request.fromNumber(), request.toNumber());
        return CallResponse.from(callRepository.save(call));
    }

    @Transactional
    public void endCall(String callSid, CallEndRequest request) {
        callRepository.findByCallSid(callSid).ifPresent(call -> {
            call.updateStatus(CallStatus.COMPLETED, request.durationSec());
            callRepository.save(call);
        });
    }

    @Transactional(readOnly = true)
    public List<CallResponse> findAll() {
        return callRepository.findAllOrderByStartedAtDesc()
                .stream()
                .map(CallResponse::from)
                .toList();
    }
}
