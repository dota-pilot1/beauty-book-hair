package com.cj.twilio.callcenter.user.application;

import com.cj.twilio.callcenter.auth.domain.RefreshToken;
import com.cj.twilio.callcenter.auth.infrastructure.RefreshTokenRepository;
import com.cj.twilio.callcenter.auth.jwt.JwtTokenProvider;
import com.cj.twilio.callcenter.auth.jwt.TokenType;
import com.cj.twilio.callcenter.auth.security.UserPrincipal;
import com.cj.twilio.callcenter.common.exception.BusinessException;
import com.cj.twilio.callcenter.common.exception.DuplicateEmailException;
import com.cj.twilio.callcenter.common.exception.ErrorCode;
import com.cj.twilio.callcenter.common.exception.InvalidRefreshTokenException;
import com.cj.twilio.callcenter.user.domain.User;
import com.cj.twilio.callcenter.user.infrastructure.UserRepository;
import com.cj.twilio.callcenter.user.presentation.dto.*;
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

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public SignupResponse signup(SignupRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new DuplicateEmailException();
        }
        String hash = passwordEncoder.encode(req.password());
        User saved = userRepository.save(User.createNewUser(req.email(), hash, req.username()));
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
        return issueTokens(p.getId(), p.getEmail(), p.getUsername(),
                userRepository.findById(p.getId()).orElseThrow());
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

        return issueTokens(user.getId(), user.getEmail(), user.getUsername(), user);
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    private TokenResponse issueTokens(Long userId, String email, String username, User user) {
        String access  = jwtTokenProvider.generateAccessToken(userId, email, username, user.getRole());
        String refresh = jwtTokenProvider.generateRefreshToken(userId);
        Instant expiresAt = Instant.now().plusMillis(jwtTokenProvider.getRefreshTokenExpirationMs());

        refreshTokenRepository.findByUserId(userId).ifPresentOrElse(
                rt -> rt.rotate(refresh, expiresAt),
                () -> refreshTokenRepository.save(RefreshToken.create(userId, refresh, expiresAt))
        );

        long expiresInSec = jwtTokenProvider.getAccessTokenExpirationMs() / 1000;
        return new TokenResponse(access, refresh, expiresInSec, UserSummary.from(user));
    }
}
