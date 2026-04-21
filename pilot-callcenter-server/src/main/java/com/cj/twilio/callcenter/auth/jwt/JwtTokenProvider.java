package com.cj.twilio.callcenter.auth.jwt;

import com.cj.twilio.callcenter.user.domain.UserRole;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final JwtProperties props;
    private final SecretKey key;

    public JwtTokenProvider(JwtProperties props) {
        this.props = props;
        byte[] bytes = props.secret().getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("jwt.secret must be at least 32 bytes");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
    }

    public String generateAccessToken(Long userId, String email, String username, UserRole role) {
        Date now = new Date();
        return Jwts.builder()
                .issuer(props.issuer())
                .subject(String.valueOf(userId))
                .claim("email", email)
                .claim("username", username)
                .claim("role", role.name())
                .claim("type", TokenType.ACCESS.name())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + props.accessTokenExpirationMs()))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    public String generateRefreshToken(Long userId) {
        Date now = new Date();
        return Jwts.builder()
                .issuer(props.issuer())
                .subject(String.valueOf(userId))
                .claim("type", TokenType.REFRESH.name())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + props.refreshTokenExpirationMs()))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    public Jws<Claims> parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .requireIssuer(props.issuer())
                .build()
                .parseSignedClaims(token);
    }

    public Long getUserId(Claims c)    { return Long.parseLong(c.getSubject()); }
    public String getEmail(Claims c)   { return c.get("email", String.class); }
    public String getUsername(Claims c){ return c.get("username", String.class); }
    public String getRole(Claims c)    { return c.get("role", String.class); }
    public TokenType getType(Claims c) { return TokenType.valueOf(c.get("type", String.class)); }

    public long getAccessTokenExpirationMs()  { return props.accessTokenExpirationMs(); }
    public long getRefreshTokenExpirationMs() { return props.refreshTokenExpirationMs(); }
}
