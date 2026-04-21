package com.cj.twilio.callcenter.voice.infrastructure;

import com.cj.twilio.callcenter.voice.domain.Call;
import com.cj.twilio.callcenter.voice.domain.CallRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
interface CallJpaRepositoryDelegate extends JpaRepository<Call, Long> {
    Optional<Call> findByCallSid(String callSid);
    List<Call> findAllByOrderByStartedAtDesc();
}

@Repository
class CallJpaRepository implements CallRepository {

    private final CallJpaRepositoryDelegate delegate;

    CallJpaRepository(CallJpaRepositoryDelegate delegate) {
        this.delegate = delegate;
    }

    @Override
    public Call save(Call call) {
        return delegate.save(call);
    }

    @Override
    public Optional<Call> findByCallSid(String callSid) {
        return delegate.findByCallSid(callSid);
    }

    @Override
    public List<Call> findAllOrderByStartedAtDesc() {
        return delegate.findAllByOrderByStartedAtDesc();
    }
}
