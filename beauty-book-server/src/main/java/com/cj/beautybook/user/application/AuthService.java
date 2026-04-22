package com.cj.beautybook.user.application;

import com.cj.beautybook.auth.domain.RefreshToken;
import com.cj.beautybook.auth.infrastructure.RefreshTokenRepository;
import com.cj.beautybook.auth.jwt.JwtTokenProvider;
import com.cj.beautybook.auth.jwt.TokenType;
import com.cj.beautybook.auth.security.UserPrincipal;
import com.cj.beautybook.common.exception.BusinessException;
import com.cj.beautybook.common.exception.DuplicateEmailException;
import com.cj.beautybook.common.exception.ErrorCode;
import com.cj.beautybook.common.exception.InvalidRefreshTokenException;
import com.cj.beautybook.config.RoleSeeder;
import com.cj.beautybook.role.domain.Role;
import com.cj.beautybook.role.infrastructure.RoleRepository;
import com.cj.beautybook.user.domain.User;
import com.cj.beautybook.user.infrastructure.UserRepository;
import com.cj.beautybook.user.presentation.dto.*;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public SignupResponse signup(SignupRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new DuplicateEmailException();
        }
        String signupRoleCode = userRepository.count() == 0
                ? RoleSeeder.ROLE_ADMIN
                : RoleSeeder.ROLE_USER;
        Role defaultRole = roleRepository.findByCode(signupRoleCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROLE_NOT_FOUND));
        String hash = passwordEncoder.encode(req.password());
        User saved = userRepository.save(User.createNewUser(req.email(), hash, req.username(), defaultRole));
        return SignupResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public boolean isEmailAvailable(String email) {
        return !userRepository.existsByEmail(email);
    }

    @Transactional
    public TokenResponse login(LoginRequest req) {
        Authentication auth;
        try {
            auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.email(), req.password())
            );
        } catch (BadCredentialsException e) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }
        UserPrincipal p = (UserPrincipal) auth.getPrincipal();
        if (!p.isEnabled()) throw new BusinessException(ErrorCode.ACCOUNT_INACTIVE);
        User user = userRepository.findById(p.getId()).orElseThrow();
        return issueTokens(user);
    }

    @Transactional
    public TokenResponse refresh(RefreshRequest req) {
        Claims claims;
        try {
            claims = jwtTokenProvider.parse(req.refreshToken()).getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            throw new InvalidRefreshTokenException();
        }
        if (jwtTokenProvider.getType(claims) != TokenType.REFRESH) {
            throw new InvalidRefreshTokenException();
        }
        Long userId = jwtTokenProvider.getUserId(claims);

        RefreshToken saved = refreshTokenRepository.findByUserId(userId)
                .orElseThrow(InvalidRefreshTokenException::new);

        if (!saved.getToken().equals(req.refreshToken()) || saved.isExpired()) {
            refreshTokenRepository.deleteByUserId(userId);
            throw new InvalidRefreshTokenException();
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (!user.isActive()) throw new BusinessException(ErrorCode.ACCOUNT_INACTIVE);

        return issueTokens(user);
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    private TokenResponse issueTokens(User user) {
        List<String> permCodes = user.getRole().getPermissions()
                .stream().map(p -> p.getCode()).toList();
        String access  = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getUsername(), user.getRole().getCode(), permCodes);
        String refresh = jwtTokenProvider.generateRefreshToken(user.getId());
        Instant expiresAt = Instant.now().plusMillis(jwtTokenProvider.getRefreshTokenExpirationMs());

        refreshTokenRepository.findByUserId(user.getId()).ifPresentOrElse(
                rt -> rt.rotate(refresh, expiresAt),
                () -> refreshTokenRepository.save(RefreshToken.create(user.getId(), refresh, expiresAt))
        );

        long expiresInSec = jwtTokenProvider.getAccessTokenExpirationMs() / 1000;
        return new TokenResponse(access, refresh, expiresInSec, UserSummary.from(user));
    }
}
