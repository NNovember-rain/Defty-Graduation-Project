package com.defty.apigateway.service;

import com.defty.apigateway.dto.request.VerifyTokenRequest;
import com.defty.apigateway.dto.response.ApiResponse;
import com.defty.apigateway.dto.response.VerifyTokenResponse;
import com.defty.apigateway.repository.IdentityClient;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = lombok.AccessLevel.PRIVATE)
public class IdentityService {
    IdentityClient identityClient;

    public Mono<ApiResponse<VerifyTokenResponse>> verifyToken(String token) {
        return identityClient.verifyToken(
                VerifyTokenRequest.builder()
                        .token(token)
                        .build()
        );
    }
}
