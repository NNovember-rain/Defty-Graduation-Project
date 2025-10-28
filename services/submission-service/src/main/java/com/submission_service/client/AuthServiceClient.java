package com.submission_service.client;

import com.example.common_library.configuration.AuthenticationRequestInterceptor;
import com.example.common_library.response.ApiResponse;
import com.submission_service.model.dto.response.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

@FeignClient(name = "identity-service",
        configuration = {AuthenticationRequestInterceptor.class})
public interface AuthServiceClient {
    @GetMapping("/identity/users/{id}")
    ApiResponse<UserResponse> getUser(@PathVariable("id") Long id);

    @GetMapping("/identity/users/list")
    ApiResponse<Map<Long, UserResponse>> getExerciseMap(@RequestParam List<Long> userIds);
}
