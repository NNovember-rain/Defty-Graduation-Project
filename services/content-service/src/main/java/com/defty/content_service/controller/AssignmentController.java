package com.defty.content_service.controller;

import com.defty.content_service.dto.request.AssignmentRequest;
import com.defty.content_service.dto.response.ApiResponse;
import com.defty.content_service.dto.response.AssignmentResponse;
import com.defty.content_service.service.AssignmentService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/assignments")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AssignmentController {
    AssignmentService assignmentService;

    @PostMapping
    ApiResponse<AssignmentResponse> createAssignment(@RequestBody AssignmentRequest request) {
        AssignmentResponse response = assignmentService.createAssignment(request);
        return ApiResponse.<AssignmentResponse>builder()
                .result(response)
                .build();
    }
}
