package com.cj.beautybook.notification.application;

import com.cj.beautybook.reservation.domain.Reservation;
import com.cj.beautybook.user.domain.User;

public interface NotificationService {
    void sendWelcome(User user);
    void sendPasswordReset(User user, String resetUrl);
    void sendPasswordChanged(User user);
    void sendReservationRequested(Reservation reservation);
    void sendReservationConfirmed(Reservation reservation);
    void sendReservationCancelledByCustomer(Reservation reservation);
    void sendReservationCancelledByAdmin(Reservation reservation);
    void sendReservationExpired(Reservation reservation);
}
