package com.defty.class_management_service.client;

import com.example.common_library.configuration.AuthenticationRequestInterceptor;
import com.example.common_library.dto.response.UserResponse;
import com.example.common_library.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "identity-service",
        configuration = {AuthenticationRequestInterceptor.class})
public interface IdentityServiceClient {

    @GetMapping("/identity/users/{userId}")
    ApiResponse<UserResponse> getUser(@PathVariable("userId") Long userId);

    @GetMapping("/identity/users/users-with-ids")
    ApiResponse<List<UserResponse>> getListUser(@RequestParam("userIds") List<Long> userIds);

    @GetMapping("/identity/users/users-with-codeUsers")
    ApiResponse<List<UserResponse>> getListUserWithCodeUsers(@RequestParam("codeUsers") List<String> codeUsers);
}
