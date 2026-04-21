package com.cj.twilio.callcenter.auth.security;

import com.cj.twilio.callcenter.auth.jwt.JwtTokenProvider;
import com.cj.twilio.callcenter.auth.jwt.TokenType;
import com.cj.twilio.callcenter.user.domain.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String HEADER = "Authorization";
    private static final String PREFIX = "Bearer ";

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String token = resolveToken(request);
        if (token != null) {
            try {
                Claims claims = jwtTokenProvider.parse(token).getPayload();
                if (jwtTokenProvider.getType(claims) == TokenType.ACCESS) {
                    UserPrincipal principal = UserPrincipal.fromClaims(
                            jwtTokenProvider.getUserId(claims),
                            jwtTokenProvider.getEmail(claims),
                            jwtTokenProvider.getUsername(claims),
                            UserRole.valueOf(jwtTokenProvider.getRole(claims))
                    );
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (JwtException | IllegalArgumentException e) {
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest req) {
        String h = req.getHeader(HEADER);
        if (StringUtils.hasText(h) && h.startsWith(PREFIX)) return h.substring(PREFIX.length());
        return null;
    }
}
