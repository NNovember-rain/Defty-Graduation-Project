package com.defty.apigateway.repository;

import com.defty.apigateway.dto.request.VerifyTokenRequest;
import com.defty.apigateway.dto.response.ApiResponse;
import com.defty.apigateway.dto.response.VerifyTokenResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.service.annotation.PostExchange;
import reactor.core.publisher.Mono;

public interface IdentityClient {
    @PostExchange(url = "/auth/verify-token", contentType = MediaType.APPLICATION_JSON_VALUE)
    Mono<ApiResponse<VerifyTokenResponse>> verifyToken(@RequestBody VerifyTokenRequest request);
}