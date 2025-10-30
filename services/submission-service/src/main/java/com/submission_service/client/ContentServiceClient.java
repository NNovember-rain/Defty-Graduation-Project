package com.submission_service.client;

import com.example.common_library.configuration.AuthenticationRequestInterceptor;
import com.example.common_library.response.ApiResponse;
import com.submission_service.model.dto.response.AssignmentResponse;
import com.submission_service.model.dto.response.ModuleResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

@FeignClient(name = "content-service",
        configuration = {AuthenticationRequestInterceptor.class})
public interface ContentServiceClient {
    @GetMapping("/content/assignments/{assignmentId}")
    ApiResponse<AssignmentResponse> getAssignment(@PathVariable("assignmentId") Long assignmentId);

    @GetMapping("/content/assignments/list")
    ApiResponse<Map<Long, AssignmentResponse>> getExerciseMap(@RequestParam List<Long> assignmentIds);

    @GetMapping("/content/assignments/module/{id}")
    ApiResponse<ModuleResponse> getModule(@PathVariable Long id);

    @GetMapping("/content/assignments/{classId}/{assignmentId}")
    ApiResponse<AssignmentResponse> getAssignmentByClassId(@PathVariable Long classId, @PathVariable Long assignmentId);
}
