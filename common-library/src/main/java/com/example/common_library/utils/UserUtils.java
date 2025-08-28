package com.example.common_library.utils;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;
import java.util.stream.Collectors;

public class UserUtils {

    public static UserInfo getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return null;

        Object principal = authentication.getPrincipal();
        Long userId = null;
        String username = null;

        if (principal instanceof Jwt jwt) {
            Object idClaim = jwt.getClaim("userId");
            if (idClaim instanceof Number number) {
                userId = number.longValue();
            }
            username = jwt.getSubject(); // "sub" = username
        }

        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return new UserInfo(userId, username, roles);
    }

    public record UserInfo(Long userId, String username, List<String> roles) {}
}
