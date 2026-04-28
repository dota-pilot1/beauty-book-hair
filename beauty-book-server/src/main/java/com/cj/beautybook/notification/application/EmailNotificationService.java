package com.cj.beautybook.notification.application;

import com.cj.beautybook.user.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailNotificationService implements NotificationService {

    private final JavaMailSender mailSender;

    @Override
    public void sendWelcome(User user) {
        send(
            user.getEmail(),
            "[뷰티북] 가입을 환영합니다!",
            """
            안녕하세요, %s님.
            뷰티북에 오신 것을 환영합니다.

            지금 바로 예약해 보세요 → https://dxline-tallent.com/booking

            감사합니다.
            """.formatted(user.getUsername())
        );
    }

    @Override
    public void sendPasswordReset(User user, String resetUrl) {
        send(
            user.getEmail(),
            "[뷰티북] 비밀번호 재설정 안내",
            """
            안녕하세요, %s님.
            아래 링크를 클릭하여 비밀번호를 재설정하세요.
            링크는 15분간 유효합니다.

            → %s

            본인이 요청하지 않았다면 이 메일을 무시하세요.
            """.formatted(user.getUsername(), resetUrl)
        );
    }

    private void send(String to, String subject, String body) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(to);
        msg.setSubject(subject);
        msg.setText(body);
        mailSender.send(msg);
        log.info("메일 발송 완료 to={} subject={}", to, subject);
    }
}
