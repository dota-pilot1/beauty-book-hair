package com.cj.twilio.callcenter.voice.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "calls")
public class Call {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String callSid;

    private String fromNumber;
    private String toNumber;

    @Enumerated(EnumType.STRING)
    private CallStatus status;

    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private Integer durationSec;

    protected Call() {}

    public static Call createInbound(String callSid, String fromNumber, String toNumber) {
        Call call = new Call();
        call.callSid = callSid;
        call.fromNumber = fromNumber;
        call.toNumber = toNumber;
        call.status = CallStatus.RINGING;
        call.startedAt = LocalDateTime.now();
        return call;
    }

    public void updateStatus(CallStatus status, Integer durationSec) {
        this.status = status;
        if (durationSec != null) {
            this.durationSec = durationSec;
            this.endedAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public String getCallSid() { return callSid; }
    public String getFromNumber() { return fromNumber; }
    public String getToNumber() { return toNumber; }
    public CallStatus getStatus() { return status; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public LocalDateTime getEndedAt() { return endedAt; }
    public Integer getDurationSec() { return durationSec; }
}
