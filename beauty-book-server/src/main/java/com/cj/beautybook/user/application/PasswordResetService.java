package com.cj.beautybook.user.application;

import com.cj.beautybook.auth.domain.PasswordResetToken;
import com.cj.beautybook.auth.infrastructure.PasswordResetTokenRepository;
import com.cj.beautybook.common.exception.BusinessException;
import com.cj.beautybook.common.exception.ErrorCode;
import com.cj.beautybook.notification.application.NotificationService;
import com.cj.beautybook.user.domain.User;
import com.cj.beautybook.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.front-url}")
    private String frontUrl;

    @Transactional
    public void requestReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        tokenRepository.deleteByUserId(user.getId());

        PasswordResetToken token = tokenRepository.save(PasswordResetToken.create(user));
        String resetUrl = frontUrl + "/reset-password?token=" + token.getToken();

        try {
            notificationService.sendPasswordReset(user, resetUrl);
        } catch (Exception e) {
            log.warn("비밀번호 재설정 메일 발송 실패 userId={}", user.getId(), e);
        }
    }

    @Transactional
    public void confirmReset(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByTokenAndUsedFalse(token)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_PASSWORD_RESET_TOKEN));

        if (resetToken.isExpired()) {
            throw new BusinessException(ErrorCode.INVALID_PASSWORD_RESET_TOKEN);
        }

        User user = resetToken.getUser();
        user.changePassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.markUsed();
        tokenRepository.save(resetToken);
    }
}
