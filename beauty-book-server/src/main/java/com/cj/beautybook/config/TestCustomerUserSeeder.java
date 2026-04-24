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
public class TestCustomerUserSeeder implements ApplicationRunner {

    private static final String TEST_CUSTOMER_EMAIL = "customer@daum.net";
    private static final String TEST_CUSTOMER_PASSWORD = "password123";
    private static final String TEST_CUSTOMER_USERNAME = "테스트 고객";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail(TEST_CUSTOMER_EMAIL)) {
            return;
        }

        Role customerRole = roleRepository.findByCode(RoleSeeder.ROLE_USER)
                .orElseThrow(() -> new IllegalStateException("Role not found: " + RoleSeeder.ROLE_USER));

        String passwordHash = passwordEncoder.encode(TEST_CUSTOMER_PASSWORD);
        userRepository.save(User.createNewUser(
                TEST_CUSTOMER_EMAIL,
                passwordHash,
                TEST_CUSTOMER_USERNAME,
                customerRole
        ));

        log.info("Seeded test customer user: {}", TEST_CUSTOMER_EMAIL);
    }
}
