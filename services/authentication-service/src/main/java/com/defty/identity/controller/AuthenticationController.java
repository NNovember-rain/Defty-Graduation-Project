package com.defty.identity.controller;

import com.defty.identity.dto.request.AuthenticationRequest;
import com.defty.identity.dto.request.LogoutRequest;
import com.defty.identity.dto.request.RefreshRequest;
import com.defty.identity.dto.request.VerifyTokenRequest;
import com.defty.identity.dto.response.ApiResponse;
import com.defty.identity.dto.response.AuthenticationResponse;
import com.defty.identity.dto.response.VerifyTokenResponse;
import com.defty.identity.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.text.ParseException;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {
    AuthenticationService authenticationService;

    @PostMapping("/login")
    ApiResponse<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request){
        AuthenticationResponse result = authenticationService.authenticate(request);
        return ApiResponse.<AuthenticationResponse>builder()
                .result(result)
                .build();
    }

    @PostMapping("/verify-token")
    ApiResponse<VerifyTokenResponse> verifyToken(@RequestBody VerifyTokenRequest tokenRequest) throws ParseException, JOSEException {
        VerifyTokenResponse result = authenticationService.verifyToken(tokenRequest);
        return ApiResponse.<VerifyTokenResponse>builder()
                .result(result)
                .build();
    }

    @PostMapping("/logout")
    ApiResponse<Void> verifyToken(@RequestBody LogoutRequest logoutRequest) throws ParseException, JOSEException {
        authenticationService.logout(logoutRequest);
        return ApiResponse.<Void>builder()
                .build();
    }

    @PostMapping("/refresh")
    ApiResponse<AuthenticationResponse> refreshToken(@RequestBody RefreshRequest request) throws ParseException, JOSEException {
        var authenticationResponse = authenticationService.refreshToken(request);
        return ApiResponse.<AuthenticationResponse>builder()
                .result(authenticationResponse)
                .build();
    }
}