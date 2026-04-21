package com.cj.twilio.callcenter.voice.presentation;

import com.cj.twilio.callcenter.voice.application.VoiceService;
import com.cj.twilio.callcenter.voice.presentation.dto.CallEndRequest;
import com.cj.twilio.callcenter.voice.presentation.dto.CallResponse;
import com.cj.twilio.callcenter.voice.presentation.dto.CallStartRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/calls")
public class VoiceController {

    private final VoiceService voiceService;

    public VoiceController(VoiceService voiceService) {
        this.voiceService = voiceService;
    }

    @PostMapping("/start")
    public ResponseEntity<CallResponse> startCall(@RequestBody CallStartRequest request) {
        CallResponse response = voiceService.startCall(request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{callSid}/end")
    public ResponseEntity<Void> endCall(
            @PathVariable String callSid,
            @RequestBody CallEndRequest request) {
        voiceService.endCall(callSid, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<CallResponse>> getCalls() {
        return ResponseEntity.ok(voiceService.findAll());
    }
}
