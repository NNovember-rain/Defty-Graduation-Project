package com.submission_service.client;

import com.example.common_library.configuration.AuthenticationRequestInterceptor;
import com.example.common_library.response.ApiResponse;
import com.submission_service.model.dto.response.ClassResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

@FeignClient(name = "class-management-service",
        configuration = {AuthenticationRequestInterceptor.class})
public interface ClassManagementServiceClient {
    @GetMapping("/class-management-service/class/{id}")
    ApiResponse<ClassResponse> getClassById(@PathVariable Long id);

    @GetMapping("/class-management-service/class/by-ids")
    ApiResponse<Map<Long, ClassResponse>> getClassesByIds(@RequestParam List<Long> ids);
}
