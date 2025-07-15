package com.defty.identity.service.impl;

import com.defty.identity.dto.request.AuthenticationRequest;
import com.defty.identity.dto.request.LogoutRequest;
import com.defty.identity.dto.request.RefreshRequest;
import com.defty.identity.dto.request.VerifyTokenRequest;
import com.defty.identity.dto.response.AuthenticationResponse;
import com.defty.identity.dto.response.VerifyTokenResponse;
import com.defty.identity.entity.InvalidatedToken;
import com.defty.identity.entity.Permission;
import com.defty.identity.entity.Role;
import com.defty.identity.entity.User;
import com.defty.identity.exception.AppException;
import com.defty.identity.exception.ErrorCode;
import com.defty.identity.repository.InvalidatedTokenRepository;
import com.defty.identity.repository.UserRepository;
import com.defty.identity.service.AuthenticationService;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationServiceImpl implements AuthenticationService {
    UserRepository userRepository;
    InvalidatedTokenRepository invalidatedTokenRepository;

    @NonFinal
    @Value("${jwt.expiration}")
    Long expiration;

    @NonFinal
    @Value("${jwt.expiration-refresh-token}")
    Long expirationRefreshToken;

    @NonFinal
    @Value("${jwt.secret}")
    String secret;

    @Override
    public AuthenticationResponse authenticate(AuthenticationRequest request){
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.LOGIN_ERROR));

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());
        if (!authenticated) {
            throw new AppException(ErrorCode.LOGIN_ERROR);
        }

        String token = generateToken(user);
        return AuthenticationResponse.builder()
                .authenticated(true)
                .token(token)
                .build();
    }

    @Override
    public void logout(LogoutRequest request)
            throws ParseException, JOSEException {
        try{
            var signedJWT = verifyTokenPrivate(request.getToken(), true);
            String jwtId = signedJWT.getJWTClaimsSet().getJWTID();
            if (jwtId == null || jwtId.isEmpty()) {
                log.error("JWT ID is missing in the token: {}", request.getToken());
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }
            Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
            if (expirationTime == null || expirationTime.before(new Date())) {
                log.error("Token has expired: {}", request.getToken());
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }
            InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                    .jwtId(jwtId)
                    .expirationTime(expirationTime)
                    .build();
            invalidatedTokenRepository.save(invalidatedToken);
        } catch (AppException e) {
            log.error("Token already invalidated or expired: {}", request.getToken());
        }
    }

    @Override
    public VerifyTokenResponse verifyToken(VerifyTokenRequest request)
            throws JOSEException, ParseException {
        String token = request.getToken();
        boolean isValid = true;
        try{
            verifyTokenPrivate(token, false);
        } catch (AppException e) {
            isValid = false;
        }
        return VerifyTokenResponse.builder()
                .valid(isValid)
                .build();
    }

    @Override
    public AuthenticationResponse refreshToken(RefreshRequest request)
            throws ParseException, JOSEException {
        var signedJWT = verifyTokenPrivate(request.getToken(), true);
        var jwtId = signedJWT.getJWTClaimsSet().getJWTID();
        if (jwtId == null || jwtId.isEmpty()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        var expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
        InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                .jwtId(jwtId)
                .expirationTime(expirationTime)
                .build();
        invalidatedTokenRepository.save(invalidatedToken);

        var username = signedJWT.getJWTClaimsSet().getSubject();
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        String newToken = generateToken(user);
        return AuthenticationResponse.builder()
                .authenticated(true)
                .token(newToken)
                .build();
    }

    private String generateToken(User user) {
        JWSHeader jwsHeader = new JWSHeader(JWSAlgorithm.HS512);
        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getUsername())
                .issuer("defty.com")
                .issueTime(new Date())
                .expirationTime(new Date(
                        Instant.now().plus(expiration, ChronoUnit.SECONDS).toEpochMilli()
                ))
                .jwtID(UUID.randomUUID().toString())
                .claim("scope", buildScope(user))
                .build();

        Payload payload = new Payload(jwtClaimsSet.toJSONObject());
        JWSObject jwsObject = new JWSObject(jwsHeader, payload);

        try{
            jwsObject.sign(new MACSigner(secret.getBytes()));
            return jwsObject.serialize();
        } catch (Exception e) {
            log.error("Error generating token for user: {}", user.getUsername());
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }

    private String buildScope(User user) {
        StringBuilder scope = new StringBuilder();
        Set<Role> roles = user.getRoles();
        if (roles != null && !roles.isEmpty()) {
            for (Role role : roles) {
                scope.append("ROLE_").append(role.getName()).append(" ");
                Set<Permission> permissions = role.getPermissions();
                if (permissions != null && !permissions.isEmpty()) {
                    for (Permission permission : permissions) {
                        scope.append(permission.getName()).append(" ");
                    }
                }
            }
        }
        return scope.toString().trim();
    }

    private SignedJWT verifyTokenPrivate(String token,boolean isRefresh) throws ParseException, JOSEException {
        JWSVerifier verifier = new MACVerifier(secret.getBytes());
        SignedJWT signedJWT = SignedJWT.parse(token);
        Date expirationTime = (isRefresh)
                ? Date.from(signedJWT.getJWTClaimsSet().getIssueTime()
                    .toInstant().plus(expirationRefreshToken, ChronoUnit.SECONDS))
                : signedJWT.getJWTClaimsSet().getExpirationTime();
        boolean isValid = signedJWT.verify(verifier);
        if (!isValid && expirationTime.after(new Date())) {
            log.error("Invalid token: {}", token);
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        if(invalidatedTokenRepository.existsById(signedJWT.getJWTClaimsSet().getJWTID())) {
            log.error("Token has been invalidated: {}", token);
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return signedJWT;
    }
}

