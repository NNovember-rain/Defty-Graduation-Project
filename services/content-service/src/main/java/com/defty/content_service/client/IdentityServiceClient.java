package com.defty.content_service.client;


import com.example.common_library.configuration.AuthenticationRequestInterceptor;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "identity-service",
        configuration = {AuthenticationRequestInterceptor.class})
public interface IdentityServiceClient {
    @GetMapping("/identity/users/{userId}")
    void getUser(@PathVariable("userId") Long userId);
}
