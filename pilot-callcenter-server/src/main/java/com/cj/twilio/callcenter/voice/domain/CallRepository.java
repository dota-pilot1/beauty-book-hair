package com.cj.twilio.callcenter.voice.domain;

import java.util.List;
import java.util.Optional;

public interface CallRepository {
    Call save(Call call);
    Optional<Call> findByCallSid(String callSid);
    List<Call> findAllOrderByStartedAtDesc();
}
