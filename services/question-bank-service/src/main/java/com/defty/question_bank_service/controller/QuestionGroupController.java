package com.defty.question_bank_service.controller;
import com.defty.question_bank_service.dto.response.ApiResponse;
import com.defty.question_bank_service.dto.request.QuestionGroupBulkRequest;
import com.defty.question_bank_service.dto.request.QuestionGroupRequest;
import com.defty.question_bank_service.dto.response.QuestionGroupResponse;
import com.defty.question_bank_service.enums.QuestionSource;
import com.defty.question_bank_service.enums.Status;
import com.defty.question_bank_service.service.IQuestionGroupService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
//import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/question-groups")
@Validated
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class QuestionGroupController {

    IQuestionGroupService groupService;

//    @PreAuthorize("hasPermission(null, 'question_group.view.all')")
    @GetMapping
    public ApiResponse<Page<QuestionGroupResponse>> getGroups(
            @RequestParam(value = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(value = "limit", defaultValue = "10")
            @Min(value = 1, message = "Limit must be at least 1")
            @Max(value = 1000, message = "Limit cannot exceed 1000") int limit,
            @RequestParam(value = "status", required = false) Status status,
            @RequestParam(value = "testSetIds", required = false) List<UUID> testSetIds,
            @RequestParam(value = "excludeTestSetIds", required = false) List<UUID> excludeTestSetIds,
            @RequestParam(value = "tagIds", required = false) List<UUID> tagIds,
            @RequestParam(value = "questionPart", required = false) String questionPart,
            @RequestParam(value = "difficulty", required = false) String difficulty,
            @RequestParam(value = "source", required = false) QuestionSource source,
            @RequestParam(value = "sortBy", required = false) String sortBy,
            @RequestParam(value = "sortOrder", defaultValue = "desc") String sortOrder
    ) {
        Page<QuestionGroupResponse> result = groupService.getAll(
                status, testSetIds, excludeTestSetIds, tagIds, questionPart, difficulty, source,
                sortBy, sortOrder, page, limit
        );
        return new ApiResponse<>(200, null, result);
    }

//    @PreAuthorize("hasPermission(null, 'question_group.view')")
    @GetMapping("/{id}")
    public ApiResponse<QuestionGroupResponse> getById(@PathVariable UUID id) {
        return new ApiResponse<>(200, null, groupService.getById(id));
    }

//    @PreAuthorize("hasPermission(null, 'question_group.create')")
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<QuestionGroupResponse> createGroup(@Valid @RequestBody QuestionGroupRequest request) {
        return new ApiResponse<>(200, "Question group created successfully", groupService.create(request));
    }

//    @PreAuthorize("hasPermission(null, 'question_group.update')")
    @PutMapping("/{id}")
    public ApiResponse<QuestionGroupResponse> updateGroup(@PathVariable UUID id,
                                                          @Valid @RequestBody QuestionGroupRequest request) {
        return new ApiResponse<>(200, "Question group updated successfully", groupService.update(id, request));
    }

//    @PreAuthorize("hasPermission(null, 'question_group.update')")
    @PatchMapping("/{id}/toggle-status")
    public ApiResponse<QuestionGroupResponse> toggleStatus(@PathVariable UUID id) {
        return new ApiResponse<>(200, "Question group status toggled successfully", groupService.toggleStatus(id));
    }

//    @PreAuthorize("hasPermission(null, 'question_group.delete')")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteGroup(@PathVariable UUID id) {
        groupService.softDelete(id);
        return new ApiResponse<>(200, "Question group deleted successfully", null);
    }

    @GetMapping("/accessible/by-question/{questionId}")
    public ApiResponse<QuestionGroupResponse> getQuestionGroupByQuestionId(
            @PathVariable("questionId") UUID questionId
    ) {
        QuestionGroupResponse response = groupService.getQuestionGroupByQuestionId(questionId);
        return new ApiResponse<>(200, "Question group retrieved successfully", response);
    }

    // ========== BULK OPERATIONS ==========

//    @PreAuthorize("hasPermission(null, 'question_group.create')")
    @PostMapping(value = "/bulk", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<QuestionGroupResponse> createBulk(
            @RequestPart("data") @Valid QuestionGroupBulkRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files
    ) throws IOException {
        QuestionGroupResponse response = groupService.createBulk(request, files);
        return new ApiResponse<>(201, "Question group created successfully with all nested data", response);
    }

//    @PreAuthorize("hasPermission(null, 'question_group.update')")
    @PutMapping(value = "/{id}/bulk", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<QuestionGroupResponse> updateBulk(
            @PathVariable UUID id,
            @RequestPart("data") @Valid QuestionGroupBulkRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files
    ) throws IOException {
        QuestionGroupResponse response = groupService.updateBulk(id, request, files);
        return new ApiResponse<>(200, "Question group updated successfully with all nested data", response);
    }
}