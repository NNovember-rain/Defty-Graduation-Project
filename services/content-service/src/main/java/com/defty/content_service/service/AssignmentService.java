package com.defty.content_service.service;

import com.defty.content_service.dto.request.AssignmentRequest;
import com.defty.content_service.dto.response.AssignmentResponse;

public interface AssignmentService {
    AssignmentResponse createAssignment(AssignmentRequest request);
}
