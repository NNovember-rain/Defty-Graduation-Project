package com.defty.identity.configuration;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;

import java.text.ParseException;

@Component
public class CustomJwtDecoder implements JwtDecoder {

    @Value("${jwt.secret}")
    private String secret;

    @Override
    public Jwt decode(String token) throws JwtException {
        try {
            SignedJWT jwt = SignedJWT.parse(token);
            if (!jwt.verify(new MACVerifier(secret))) {
                throw new JwtException("Invalid JWT signature");
            }
            return new Jwt(token, jwt.getJWTClaimsSet().getIssueTime().toInstant(),
                    jwt.getJWTClaimsSet().getExpirationTime().toInstant(),
                    jwt.getHeader().toJSONObject(),
                    jwt.getJWTClaimsSet().getClaims()
            );
        } catch (ParseException e) {
            throw new JwtException("Invalid JWT token", e);
        } catch (JOSEException e) {
            throw new RuntimeException(e);
        }
    }
}
