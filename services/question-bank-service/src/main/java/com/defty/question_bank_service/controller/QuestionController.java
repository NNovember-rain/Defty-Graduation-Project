package com.defty.question_bank_service.controller;

import com.defty.question_bank_service.dto.response.ApiResponse;
import com.defty.question_bank_service.dto.request.QuestionRequest;
import com.defty.question_bank_service.dto.response.QuestionResponse;
import com.defty.question_bank_service.enums.Status;
import com.defty.question_bank_service.service.IQuestionService;
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
//import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/questions")
@Validated
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class QuestionController {

    IQuestionService questionService;

//    @PreAuthorize("hasPermission(null, 'question.view.all')")
    @GetMapping
    public ApiResponse<Page<QuestionResponse>> getQuestions(
            @RequestParam(required = false) UUID groupId,
            @RequestParam(required = false) Status status,
            @RequestParam(value = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(value = "limit", defaultValue = "10")
            @Min(value = 1, message = "Limit must be at least 1")
            @Max(value = 1000, message = "Limit cannot exceed 1000") int limit
    ) {
        Pageable pageable = PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "createdDate"));

        Page<QuestionResponse> questions = questionService.get(groupId, status, pageable);

        return new ApiResponse<>(200, null, questions);
    }

//    @PreAuthorize("hasPermission(null, 'question.view')")
    @GetMapping("/{id}")
    public ApiResponse<QuestionResponse> getQuestionById(@PathVariable UUID id) {
        QuestionResponse question = questionService.getById(id);
        return new ApiResponse<>(200, null, question);
    }

//    @PreAuthorize("hasPermission(null, 'question.create')")
    @PostMapping
    public ApiResponse<QuestionResponse> createQuestion(@Valid @RequestBody QuestionRequest request) {
        QuestionResponse created = questionService.create(request);
        return new ApiResponse<>(200, null, created);
    }

//    @PreAuthorize("hasPermission(null, 'question.update')")
    @PatchMapping("/{id}")
    public ApiResponse<QuestionResponse> updateQuestion(
            @PathVariable UUID id,
            @Valid @RequestBody QuestionRequest request
    ) {
        QuestionResponse updated = questionService.update(id, request);
        return new ApiResponse<>(200, null, updated);
    }

//    @PreAuthorize("hasPermission(null, 'question.delete')")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> softDeleteQuestion(@PathVariable UUID id) {
        questionService.softDelete(id);
        return new ApiResponse<>(200, "Question deleted successfully", null);
    }

//    @PreAuthorize("hasPermission(null, 'question.update')")
    @PatchMapping("/{id}/toggle-active")
    public ApiResponse<QuestionResponse> toggleStatus(@PathVariable UUID id) {
        QuestionResponse updated = questionService.toggleStatus(id);
        return new ApiResponse<>(200, "Question status updated successfully", updated);
    }

    @PostMapping("/accessible")
    public ApiResponse<Set<QuestionResponse>> getAccessibleQuestions(@RequestBody List<UUID> ids) {
        return new ApiResponse<>(200, "Get accessible questions successfully",
                questionService.getAccessibleQuestions(ids));
    }
}