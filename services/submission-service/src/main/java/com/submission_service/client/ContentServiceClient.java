package com.submission_service.client;

import com.example.common_library.configuration.AuthenticationRequestInterceptor;
import com.example.common_library.response.ApiResponse;
import com.submission_service.model.dto.response.AssignmentResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "content-service",
        configuration = {AuthenticationRequestInterceptor.class})
public interface ContentServiceClient {
    @GetMapping("/content/assignments/{assignmentId}")
    ApiResponse<AssignmentResponse> getAssignment(@PathVariable("assignmentId") Long assignmentId);
}
