package com.cj.beautybook.notification.application;

import com.cj.beautybook.reservation.domain.Reservation;
import com.cj.beautybook.site_settings.domain.SiteSetting;
import com.cj.beautybook.site_settings.infrastructure.SiteSettingRepository;
import com.cj.beautybook.user.domain.User;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailNotificationService implements NotificationService {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("yyyy년 MM월 dd일 (E) HH:mm").withZone(SEOUL);

    private final JavaMailSender mailSender;
    private final SiteSettingRepository siteSettingRepository;

    @Override
    public void sendWelcome(User user) {
        String html = """
                <div style="font-family:'Apple SD Gothic Neo',Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e8e0d8;border-radius:12px;overflow:hidden">
                  <div style="background:#1a1a1a;padding:28px 32px">
                    <p style="margin:0;font-size:20px;font-weight:700;color:#fff;letter-spacing:0.05em">BEAUTY BOOK</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#a89880;letter-spacing:0.15em">PREMIUM HAIR CARE</p>
                  </div>
                  <div style="padding:36px 32px">
                    <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a1a">환영합니다, %s님 🎉</h2>
                    <p style="margin:0 0 24px;color:#666;font-size:15px;line-height:1.6">뷰티북 회원이 되신 것을 진심으로 환영합니다.<br>지금 바로 원하는 시술을 예약해 보세요.</p>
                    <a href="https://dxline-tallent.com/booking"
                       style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.03em">
                      예약하러 가기 →
                    </a>
                  </div>
                  <div style="padding:20px 32px;background:#faf9f7;border-top:1px solid #e8e0d8">
                    <p style="margin:0;font-size:12px;color:#999">본 메일은 발신 전용입니다. 문의: dxline-tallent.com</p>
                  </div>
                </div>
                """.formatted(user.getUsername());
        sendHtml(user.getEmail(), "[뷰티북] 가입을 환영합니다!", html);
    }

    @Override
    public void sendPasswordChanged(User user) {
        String html = """
                <div style="font-family:'Apple SD Gothic Neo',Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e8e0d8;border-radius:12px;overflow:hidden">
                  <div style="background:#1a1a1a;padding:28px 32px">
                    <p style="margin:0;font-size:20px;font-weight:700;color:#fff;letter-spacing:0.05em">BEAUTY BOOK</p>
                  </div>
                  <div style="padding:36px 32px">
                    <h2 style="margin:0 0 8px;font-size:20px;color:#1a1a1a">비밀번호가 변경되었습니다</h2>
                    <p style="margin:0 0 24px;color:#666;font-size:15px;line-height:1.6">안녕하세요, %s님.<br>방금 비밀번호가 정상적으로 변경되었습니다.</p>
                    <p style="margin:0;padding:14px 16px;background:#fff8e1;border-left:3px solid #f59e0b;border-radius:4px;font-size:14px;color:#555">
                      본인이 변경하지 않았다면 즉시 비밀번호를 재설정하고 고객센터에 연락하세요.
                    </p>
                  </div>
                  <div style="padding:20px 32px;background:#faf9f7;border-top:1px solid #e8e0d8">
                    <p style="margin:0;font-size:12px;color:#999">본 메일은 발신 전용입니다. | dxline-tallent.com</p>
                  </div>
                </div>
                """.formatted(user.getUsername());
        sendHtml(user.getEmail(), "[뷰티북] 비밀번호가 변경되었습니다", html);
    }

    @Override
    public void sendPasswordReset(User user, String resetUrl) {
        String html = """
                <div style="font-family:'Apple SD Gothic Neo',Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e8e0d8;border-radius:12px;overflow:hidden">
                  <div style="background:#1a1a1a;padding:28px 32px">
                    <p style="margin:0;font-size:20px;font-weight:700;color:#fff;letter-spacing:0.05em">BEAUTY BOOK</p>
                  </div>
                  <div style="padding:36px 32px">
                    <h2 style="margin:0 0 8px;font-size:20px;color:#1a1a1a">비밀번호 재설정</h2>
                    <p style="margin:0 0 8px;color:#666;font-size:15px;line-height:1.6">안녕하세요, %s님.<br>아래 버튼을 클릭하여 비밀번호를 재설정하세요.</p>
                    <p style="margin:0 0 24px;color:#999;font-size:13px">링크는 <strong>15분간</strong> 유효합니다.</p>
                    <a href="%s"
                       style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600">
                      비밀번호 재설정 →
                    </a>
                    <p style="margin:24px 0 0;font-size:13px;color:#999">본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
                  </div>
                  <div style="padding:20px 32px;background:#faf9f7;border-top:1px solid #e8e0d8">
                    <p style="margin:0;font-size:12px;color:#999">본 메일은 발신 전용입니다.</p>
                  </div>
                </div>
                """.formatted(user.getUsername(), resetUrl);
        sendHtml(user.getEmail(), "[뷰티북] 비밀번호 재설정 안내", html);
    }

    @Override
    public void sendReservationRequested(Reservation reservation) {
        String html = buildReservationHtml(
                reservation,
                "예약이 접수되었습니다",
                "#b8860b",
                "접수 완료",
                "예약이 정상 접수되었습니다.<br>확인 후 확정 안내 드리겠습니다."
        );
        sendHtml(reservation.getCustomer().getEmail(), "[뷰티북] 예약이 접수되었습니다", html);

        siteSettingRepository.findById(SiteSetting.SINGLETON_ID)
                .ifPresent(s -> s.getReservationRequestEmails().forEach(email ->
                        sendHtml(email, "[뷰티북] 새 예약 요청이 접수되었습니다",
                                buildAdminReservationRequestHtml(reservation))));
    }

    @Override
    public void sendReservationConfirmed(Reservation reservation) {
        String html = buildReservationHtml(
                reservation,
                "예약이 확정되었습니다",
                "#2e7d32",
                "예약 확정",
                "예약이 확정되었습니다.<br>방문을 기다리겠습니다 😊"
        );
        sendHtml(reservation.getCustomer().getEmail(), "[뷰티북] 예약이 확정되었습니다", html);
    }

    @Override
    public void sendReservationCancelledByCustomer(Reservation reservation) {
        String html = buildReservationHtml(
                reservation,
                "예약이 취소되었습니다",
                "#757575",
                "예약 취소",
                "고객님의 요청으로 예약이 취소되었습니다.<br>또 방문 원하실 때 언제든지 예약해 주세요."
        );
        sendHtml(reservation.getCustomer().getEmail(), "[뷰티북] 예약이 취소되었습니다", html);
    }

    @Override
    public void sendReservationCancelledByAdmin(Reservation reservation) {
        String memo = (reservation.getAdminMemo() != null && !reservation.getAdminMemo().isBlank())
                ? "<p style=\"margin:16px 0 0;padding:14px 16px;background:#f5f5f5;border-left:3px solid #bbb;border-radius:4px;font-size:14px;color:#555\">사유: " + reservation.getAdminMemo() + "</p>"
                : "";
        String html = buildReservationHtml(
                reservation,
                "예약이 취소되었습니다",
                "#c62828",
                "예약 취소 (매장)",
                "죄송합니다, 매장 사정으로 예약이 취소되었습니다.<br>불편을 드려 죄송합니다." + memo
        );
        sendHtml(reservation.getCustomer().getEmail(), "[뷰티북] 예약이 취소되었습니다", html);
    }

    @Override
    public void sendReservationExpired(Reservation reservation) {
        String html = buildReservationHtml(
                reservation,
                "예약 요청이 만료되었습니다",
                "#9e9e9e",
                "요청 만료",
                "1시간 내에 매장 확정이 이뤄지지 않아 예약 요청이 자동 취소되었습니다.<br>다시 원하는 시간으로 예약해 주세요."
        );
        sendHtml(reservation.getCustomer().getEmail(), "[뷰티북] 예약 요청이 만료되었습니다", html);
    }

    private String buildReservationHtml(Reservation r, String title, String badgeColor, String badge, String message) {
        return """
                <div style="font-family:'Apple SD Gothic Neo',Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e8e0d8;border-radius:12px;overflow:hidden">
                  <div style="background:#1a1a1a;padding:28px 32px">
                    <p style="margin:0;font-size:20px;font-weight:700;color:#fff;letter-spacing:0.05em">BEAUTY BOOK</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#a89880;letter-spacing:0.15em">PREMIUM HAIR CARE</p>
                  </div>
                  <div style="padding:36px 32px">
                    <span style="display:inline-block;background:%s;color:#fff;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;margin-bottom:16px">%s</span>
                    <h2 style="margin:0 0 8px;font-size:20px;color:#1a1a1a">%s님, %s</h2>
                    <p style="margin:0 0 28px;color:#666;font-size:15px;line-height:1.6">%s</p>
                    <table style="width:100%%;border-collapse:collapse;font-size:14px">
                      <tr style="border-bottom:1px solid #f0ebe4">
                        <td style="padding:12px 0;color:#999;width:90px">시술</td>
                        <td style="padding:12px 0;color:#1a1a1a;font-weight:600">%s</td>
                      </tr>
                      <tr style="border-bottom:1px solid #f0ebe4">
                        <td style="padding:12px 0;color:#999">디자이너</td>
                        <td style="padding:12px 0;color:#1a1a1a;font-weight:600">%s</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;color:#999">일시</td>
                        <td style="padding:12px 0;color:#1a1a1a;font-weight:600">%s</td>
                      </tr>
                    </table>
                  </div>
                  <div style="padding:20px 32px;background:#faf9f7;border-top:1px solid #e8e0d8">
                    <p style="margin:0;font-size:12px;color:#999">취소·변경은 사전에 연락 부탁드립니다. | dxline-tallent.com</p>
                  </div>
                </div>
                """.formatted(
                badgeColor, badge,
                r.getCustomerName(), title,
                message,
                r.getBeautyService().getName(),
                r.getStaff().getName(),
                FMT.format(r.getStartAt())
        );
    }

    private String buildAdminReservationRequestHtml(Reservation r) {
        return """
                <div style="font-family:'Apple SD Gothic Neo',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e0d8;border-radius:12px;overflow:hidden">
                  <div style="background:#1a1a1a;padding:28px 32px">
                    <p style="margin:0;font-size:20px;font-weight:700;color:#fff;letter-spacing:0.05em">BEAUTY BOOK</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#a89880;letter-spacing:0.15em">ADMIN NOTICE</p>
                  </div>
                  <div style="padding:36px 32px">
                    <span style="display:inline-block;background:#b8860b;color:#fff;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;margin-bottom:16px">예약 요청</span>
                    <h2 style="margin:0 0 8px;font-size:20px;color:#1a1a1a">새 예약 요청이 접수되었습니다</h2>
                    <p style="margin:0 0 28px;color:#666;font-size:15px;line-height:1.6">관리자 화면에서 예약 내용을 확인하고 승인 여부를 처리해주세요.</p>
                    <table style="width:100%%;border-collapse:collapse;font-size:14px">
                      <tr style="border-bottom:1px solid #f0ebe4">
                        <td style="padding:12px 0;color:#999;width:100px">고객</td>
                        <td style="padding:12px 0;color:#1a1a1a;font-weight:600">%s</td>
                      </tr>
                      <tr style="border-bottom:1px solid #f0ebe4">
                        <td style="padding:12px 0;color:#999">연락처</td>
                        <td style="padding:12px 0;color:#1a1a1a;font-weight:600">%s</td>
                      </tr>
                      <tr style="border-bottom:1px solid #f0ebe4">
                        <td style="padding:12px 0;color:#999">시술</td>
                        <td style="padding:12px 0;color:#1a1a1a;font-weight:600">%s</td>
                      </tr>
                      <tr style="border-bottom:1px solid #f0ebe4">
                        <td style="padding:12px 0;color:#999">디자이너</td>
                        <td style="padding:12px 0;color:#1a1a1a;font-weight:600">%s</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;color:#999">일시</td>
                        <td style="padding:12px 0;color:#1a1a1a;font-weight:600">%s</td>
                      </tr>
                    </table>
                  </div>
                  <div style="padding:20px 32px;background:#faf9f7;border-top:1px solid #e8e0d8">
                    <p style="margin:0;font-size:12px;color:#999">예약 요청 수신 이메일은 관리자 메일 관리에서 변경할 수 있습니다.</p>
                  </div>
                </div>
                """.formatted(
                r.getCustomerName(),
                r.getCustomerPhone(),
                r.getBeautyService().getName(),
                r.getStaff().getName(),
                FMT.format(r.getStartAt())
        );
    }

    private void sendHtml(String to, String subject, String html) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, false, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(msg);
            log.info("메일 발송 완료 to={} subject={}", to, subject);
        } catch (Exception e) {
            log.error("메일 발송 실패 to={} subject={}", to, subject, e);
            throw new RuntimeException(e);
        }
    }
}
