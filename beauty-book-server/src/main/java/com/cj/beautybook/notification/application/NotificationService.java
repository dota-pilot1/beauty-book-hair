package com.cj.beautybook.notification.application;

import com.cj.beautybook.user.domain.User;

public interface NotificationService {
    void sendWelcome(User user);
    void sendPasswordReset(User user, String resetUrl);
}
