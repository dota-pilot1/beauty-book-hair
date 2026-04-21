package com.cj.twilio.callcenter.common.exception;

public class InvalidRefreshTokenException extends BusinessException {
    public InvalidRefreshTokenException() {
        super(ErrorCode.INVALID_REFRESH_TOKEN);
    }
}
