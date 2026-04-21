package com.cj.twilio.callcenter.auth.security;

import com.cj.twilio.callcenter.user.domain.User;
import com.cj.twilio.callcenter.user.domain.UserRole;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String username;
    private final String passwordHash;
    private final UserRole role;
    private final boolean active;

    private UserPrincipal(Long id, String email, String username, String passwordHash, UserRole role, boolean active) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.passwordHash = passwordHash;
        this.role = role;
        this.active = active;
    }

    public static UserPrincipal fromEntity(User u) {
        return new UserPrincipal(u.getId(), u.getEmail(), u.getUsername(), u.getPasswordHash(), u.getRole(), u.isActive());
    }

    public static UserPrincipal fromClaims(Long id, String email, String username, UserRole role) {
        return new UserPrincipal(id, email, username, null, role, true);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    @Override public String getPassword()   { return passwordHash; }
    @Override public String getUsername()   { return email; }
    @Override public boolean isEnabled()    { return active; }
    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isAccountNonLocked()      { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
}
