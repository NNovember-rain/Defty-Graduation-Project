package com.defty.content_service.service;

import com.defty.content_service.dto.request.AssignRequest;
import com.defty.content_service.dto.request.AssignmentRequest;
import com.defty.content_service.dto.response.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface AssignmentService {
    Page<AssignmentResponse> getAllAssignments(Long classId, Long typeUmlId, String title, Pageable pageable);
    Page<AssignmentResponse> getUnassignedAssignments(Long classId, String mode, Pageable pageable);
    List<AssignmentResponse> assignAssignment(AssignRequest assignRequest);
    void unassignAssignment(Long assignmentClassDetailId);
    AssignmentResponse getAssignment(Long assignmentId);
    void deleteAssignment(Long assignmentId);
    AssignmentResponse toggleAssignmentStatus(Long assignmentId );
    Page<AssignmentClassResponse> getAssignmentsByClassId(Long classId, Pageable pageable);
    AssignmentClassResponse getAssignmentByClassId(Long classId, Long assignmentId);
    AssignmentResponse createAssignment(AssignmentRequest request);
    AssignmentResponse updateAssignment(Long id, AssignmentRequest request);
    Map<Long, AssignmentResponse> getAssignmentsByIds(List<Long> assignmentIds);
    ModuleResponse getAssignmentModule(Long moduleId);
    AssignmentClassResponse getAssignmentClassDetailId(Long assignmentClassDetailId);
    AssignmentResponseByClass getAssignmentAllModule(Long assignmentClassId);
    AssignmentClassDetailResponse getAssignmentClassDetail(Long assignmentClassDetailId, String typeUml, Long moduleId);
    List<ModuleResponse> getModulesByIds(List<Long> moduleIds);
}
