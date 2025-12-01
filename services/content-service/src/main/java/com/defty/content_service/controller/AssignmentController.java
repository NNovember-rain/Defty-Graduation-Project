package com.defty.content_service.controller;

import com.defty.content_service.dto.request.AssignRequest;
import com.defty.content_service.dto.request.AssignmentRequest;
import com.defty.content_service.dto.response.*;
import com.defty.content_service.service.AssignmentService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.repository.query.Param;
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

    @DeleteMapping("/unassign/{assignmentClassDetailId}")
    ApiResponse<?> unassignAssignment(@PathVariable Long assignmentClassDetailId){
       assignmentService.unassignAssignment(assignmentClassDetailId);
       return ApiResponse.builder()
               .message("Unassign assignment successfully")
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

    @GetMapping("/unassigned/{classId}")
    public ApiResponse<Page<AssignmentResponse>> getUnassignedAssignments(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @PathVariable Long classId,
            @RequestParam(value = "mode") String mode) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdDate").descending());
        Page<AssignmentResponse> responsePage = assignmentService.getUnassignedAssignments(classId, mode, pageable);

        return ApiResponse.<Page<AssignmentResponse>>builder()
                .result(responsePage)
                .build();
    }


    @GetMapping("/class/{classId}")
    public ApiResponse<Page<AssignmentClassResponse>> getAllAssignmentsByClassId(@RequestParam(value = "page", defaultValue = "0") int page,
                                                                            @RequestParam(value = "size", defaultValue = "10") int size,
                                                                            @PathVariable Long classId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdDate").descending());
        Page<AssignmentClassResponse> responsePage = assignmentService.getAssignmentsByClassId(classId, pageable);
        return ApiResponse.<Page<AssignmentClassResponse>>builder()
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

    @GetMapping("/detail/all-module/{assignmentClassId}")
    ApiResponse<AssignmentResponseByClass> getAssignmentModule(@PathVariable Long assignmentClassId) {
        AssignmentResponseByClass response = assignmentService.getAssignmentAllModule(assignmentClassId);
        return ApiResponse.<AssignmentResponseByClass>builder()
                .result(response)
                .build();
    }

    @GetMapping("/{classId}/{assignmentId}")
    ApiResponse<AssignmentClassResponse> getAssignmentByClassId(@PathVariable Long classId, @PathVariable Long assignmentId) {
        AssignmentClassResponse response = assignmentService.getAssignmentByClassId(classId, assignmentId);
        return ApiResponse.<AssignmentClassResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping("/detail/{assignmentClassDetailId}")
    ApiResponse<AssignmentClassResponse> getAssignmentByClassId( @PathVariable Long assignmentClassDetailId) {
        AssignmentClassResponse response = assignmentService.getAssignmentClassDetailId(assignmentClassDetailId);
        return ApiResponse.<AssignmentClassResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping("/assignmentClassDetail/{assignmentClassDetailId}")
    ApiResponse<AssignmentClassDetailResponse> getAssignmentClassDetail(@PathVariable Long assignmentClassDetailId,
                                                                        @RequestParam(value = "typeUml", required = false) String typeUml,
                                                                        @RequestParam(value = "moduleId", required = false) Long moduleId) {
        AssignmentClassDetailResponse response = assignmentService.getAssignmentClassDetail(assignmentClassDetailId, typeUml, moduleId);
        return ApiResponse.<AssignmentClassDetailResponse>builder()
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

    @GetMapping("/list-module")
    public ApiResponse<Map<Long, List<ModuleResponse>>> getModuleMap(@RequestParam List<Long> assignmentClassDetailIds) {
        Map<Long, List<ModuleResponse>> result = assignmentService.getModulesByIds(assignmentClassDetailIds);
        return ApiResponse.<Map<Long, List<ModuleResponse>>>builder()
                .result(result)
                .message("Fetched modules successfully")
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
