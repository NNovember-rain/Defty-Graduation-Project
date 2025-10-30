package com.defty.content_service.controller;

import com.defty.content_service.dto.request.AssignRequest;
import com.defty.content_service.dto.request.AssignmentRequest;
import com.defty.content_service.dto.response.ApiResponse;
import com.defty.content_service.dto.response.AssignmentResponse;
import com.defty.content_service.dto.response.MaterialUploadResponse;
import com.defty.content_service.dto.response.ModuleResponse;
import com.defty.content_service.service.AssignmentService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.parameters.P;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/assignments")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AssignmentController {
    AssignmentService assignmentService;

    @PostMapping("/assign")
    ApiResponse<List<AssignmentResponse>> assignAssignment(@RequestBody AssignRequest assignRequest) {
        List<AssignmentResponse> response = assignmentService.assignAssignment(assignRequest);
        return ApiResponse.<List<AssignmentResponse>>builder()
                .result(response)
                .build();
    }

    @PostMapping("")
    ApiResponse<AssignmentResponse> createAssignment(@RequestBody AssignmentRequest assignmentRequest) {
        AssignmentResponse response = assignmentService.createAssignment(assignmentRequest);
        return ApiResponse.<AssignmentResponse>builder()
                .result(response)
                .build();
    }

    @PatchMapping("/update/{id}")
    ApiResponse<AssignmentResponse> updateAssignment(@PathVariable Long id,
                                                     @RequestBody AssignmentRequest assignmentRequest) {
        AssignmentResponse response = assignmentService.updateAssignment(id,assignmentRequest);
        return ApiResponse.<AssignmentResponse>builder()
                .result(response)
                .build();
    }

    @PostMapping("/unassign")
    ApiResponse<AssignmentResponse> unassignAssignment(@RequestBody AssignmentRequest request) {
        AssignmentResponse response = assignmentService.unassignAssignment(request);
        return ApiResponse.<AssignmentResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping
    public ApiResponse<Page<AssignmentResponse>> getAllAssignments(@RequestParam(value = "page", defaultValue = "0") int page,
                                                                   @RequestParam(value = "size", defaultValue = "10") int size,
                                                                   @RequestParam(value = "classId", required = false) Long classId,
                                                                   @RequestParam(value = "typeUmlId", required = false) Long typeUmlId,
                                                                   @RequestParam(value = "title", required = false) String title) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdDate").descending());
        Page<AssignmentResponse> responsePage = assignmentService.getAllAssignments(classId, typeUmlId, title, pageable);
        return ApiResponse.<Page<AssignmentResponse>>builder()
                .result(responsePage)
                .build();
    }

    @GetMapping("/class/{classId}")
    public ApiResponse<Page<AssignmentResponse>> getAllAssignmentsByClassId(@RequestParam(value = "page", defaultValue = "0") int page,
                                                                            @RequestParam(value = "size", defaultValue = "10") int size,
                                                                            @PathVariable Long classId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdDate").descending());
        Page<AssignmentResponse> responsePage = assignmentService.getAssignmentsByClassId(classId, pageable);
        return ApiResponse.<Page<AssignmentResponse>>builder()
                .result(responsePage)
                .build();
    }

    @GetMapping("/{assignmentId}")
     ApiResponse<AssignmentResponse> getAssignment(@PathVariable Long assignmentId) {
        AssignmentResponse response = assignmentService.getAssignment(assignmentId);
        return ApiResponse.<AssignmentResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping("/{classId}/{assignmentId}")
    ApiResponse<AssignmentResponse> getAssignmentByClassId(@PathVariable Long classId, @PathVariable Long assignmentId) {
        AssignmentResponse response = assignmentService.getAssignmentByClassId(classId, assignmentId);
        return ApiResponse.<AssignmentResponse>builder()
                .result(response)
                .build();
    }

    @PatchMapping("/{id}/toggle-active")
    public ApiResponse<AssignmentResponse> toggleActiveStatus(@PathVariable Long id) {
        AssignmentResponse updatedAssignment = assignmentService.toggleAssignmentStatus(id);
        return ApiResponse.<AssignmentResponse>builder()
                .result(updatedAssignment)
                .message("Assignment status updated successfully")
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deletePermission(@PathVariable Long id) {
        assignmentService.deleteAssignment(id);
        return ApiResponse.<Void>builder()
                .message("Assignment deleted successfully")
                .build();
    }

    @GetMapping("/list")
    public ApiResponse<Map<Long, AssignmentResponse>> getExerciseMap(@RequestParam List<Long> assignmentIds) {
        Map<Long, AssignmentResponse> result = assignmentService.getAssignmentsByIds(assignmentIds);
        return ApiResponse.<Map<Long, AssignmentResponse>>builder()
                .result(result)
                .message("Fetched assignment successfully")
                .build();
    }

    @GetMapping("/module/{id}")
    public ApiResponse<ModuleResponse> getModule(@PathVariable Long id) {
        ModuleResponse response = assignmentService.getAssignmentModule(id);
        return ApiResponse.<ModuleResponse>builder()
                .result(response)
                .message("Fetched assignment successfully")
                .build();
    }

}
