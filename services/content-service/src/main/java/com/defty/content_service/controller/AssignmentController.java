package com.defty.content_service.controller;

import com.defty.content_service.dto.request.AssignmentRequest;
import com.defty.content_service.dto.response.ApiResponse;
import com.defty.content_service.dto.response.AssignmentResponse;
import com.defty.content_service.dto.response.MaterialUploadResponse;
import com.defty.content_service.service.AssignmentService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/assignments")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AssignmentController {
    AssignmentService assignmentService;

    @PostMapping("/assign")
    ApiResponse<AssignmentResponse> assignAssignment(@RequestBody AssignmentRequest request) {
        AssignmentResponse response = assignmentService.assignAssignment(request);
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
    public ApiResponse<Page<AssignmentResponse>> getAllAssignments(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "classId", required = false) Long classId,
            @RequestParam(value = "typeUmlId", required = false) Long typeUmlId,
            @RequestParam(value = "title", required = false) String title
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdDate").descending());
        Page<AssignmentResponse> responsePage = assignmentService.getAllAssignments(classId, typeUmlId, title, pageable);
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
}
