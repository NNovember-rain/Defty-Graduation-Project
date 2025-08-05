package com.defty.content_service.service;

import com.defty.content_service.dto.request.AssignmentRequest;
import com.defty.content_service.dto.response.AssignmentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AssignmentService {
    Page<AssignmentResponse> getAllAssignments(Long classId, Long typeUmlId, String title, Pageable pageable);
    AssignmentResponse assignAssignment(AssignmentRequest request);
    AssignmentResponse unassignAssignment(AssignmentRequest request);
    AssignmentResponse getAssignment(Long assignmentId);
    void deleteAssignment(Long assignmentId);
    AssignmentResponse toggleAssignmentStatus(Long assignmentId );
}
