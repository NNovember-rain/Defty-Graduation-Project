package com.defty.content_service.service;

import com.defty.content_service.dto.request.AssignRequest;
import com.defty.content_service.dto.request.AssignmentRequest;
import com.defty.content_service.dto.response.AssignmentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface AssignmentService {
    Page<AssignmentResponse> getAllAssignments(Long classId, Long typeUmlId, String title, Pageable pageable);
    List<AssignmentResponse> assignAssignment(AssignRequest assignRequest);
    AssignmentResponse unassignAssignment(AssignmentRequest request);
    AssignmentResponse getAssignment(Long assignmentId);
    void deleteAssignment(Long assignmentId);
    AssignmentResponse toggleAssignmentStatus(Long assignmentId );
    Page<AssignmentResponse> getAssignmentsByClassId(Long classId, Pageable pageable);
    AssignmentResponse getAssignmentByClassId(Long classId, Long assignmentId);
    AssignmentResponse createAssignment(AssignmentRequest request);
    AssignmentResponse updateAssignment(Long id, AssignmentRequest request);
    Map<Long, AssignmentResponse> getAssignmentsByIds(List<Long> assignmentIds);
}
