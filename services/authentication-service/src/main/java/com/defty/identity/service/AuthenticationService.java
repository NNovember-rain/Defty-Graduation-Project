package com.defty.identity.service;

import com.defty.identity.dto.request.AuthenticationRequest;
import com.defty.identity.dto.request.LogoutRequest;
import com.defty.identity.dto.request.RefreshRequest;
import com.defty.identity.dto.request.VerifyTokenRequest;
import com.defty.identity.dto.response.AuthenticationResponse;
import com.defty.identity.dto.response.VerifyTokenResponse;
import com.nimbusds.jose.JOSEException;

import java.text.ParseException;

public interface AuthenticationService {
    /**
     * Authenticates a user with the provided username and password.
     * @return true if authentication is successful, false otherwise
     */
    AuthenticationResponse authenticate(AuthenticationRequest request);
    void logout(LogoutRequest logoutRequest) throws ParseException, JOSEException;
    VerifyTokenResponse verifyToken(VerifyTokenRequest request)
            throws JOSEException, ParseException;
    AuthenticationResponse refreshToken(RefreshRequest request) throws ParseException, JOSEException;
}
