package com.cj.beautybook.config;

import com.cj.beautybook.role.domain.Role;
import com.cj.beautybook.role.infrastructure.RoleRepository;
import com.cj.beautybook.user.domain.User;
import com.cj.beautybook.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@Order(5)
@RequiredArgsConstructor
public class AdminUserSeeder implements ApplicationRunner {

    private static final String ADMIN_EMAIL = "admin@daum.net";
    private static final String ADMIN_PASSWORD = "password123";
    private static final String ADMIN_USERNAME = "관리자";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail(ADMIN_EMAIL)) {
            return;
        }

        Role adminRole = roleRepository.findByCode(RoleSeeder.ROLE_ADMIN)
                .orElseThrow(() -> new IllegalStateException("Role not found: " + RoleSeeder.ROLE_ADMIN));

        userRepository.save(User.createNewUser(
                ADMIN_EMAIL,
                passwordEncoder.encode(ADMIN_PASSWORD),
                ADMIN_USERNAME,
                adminRole
        ));

        log.info("Seeded admin user: {}", ADMIN_EMAIL);
    }
}
