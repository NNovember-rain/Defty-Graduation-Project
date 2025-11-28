package com.defty.question_bank_service.controller;

import com.defty.question_bank_service.dto.response.ApiResponse;
import com.defty.question_bank_service.dto.request.AnswerRequest;
import com.defty.question_bank_service.dto.response.AnswerResponse;
import com.defty.question_bank_service.enums.Status;
import com.defty.question_bank_service.service.IAnswerService;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/answers")
@Validated
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AnswerController {

    IAnswerService answerService;

//    @PreAuthorize("hasPermission(null, 'answer.view.all')")
    @GetMapping
    public ApiResponse<Page<AnswerResponse>> getAnswers(
            @RequestParam(required = false) UUID questionId,
            @RequestParam(required = false) Status status,
            @RequestParam(value = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(value = "limit", defaultValue = "10")
            @Min(value = 1, message = "Limit must be at least 1")
            @Max(value = 1000, message = "Limit cannot exceed 1000") int limit
    ) {
        Pageable pageable = PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "createdDate"));
        Page<AnswerResponse> answers = answerService.get(questionId, status, pageable);
        return new ApiResponse<>(200, null, answers);
    }

//    @PreAuthorize("hasPermission(null, 'answer.view')")
    @GetMapping("/{id}")
    public ApiResponse<AnswerResponse> getAnswerById(@PathVariable UUID id) {
        AnswerResponse answer = answerService.getById(id);
        return new ApiResponse<>(200, null, answer);
    }

//    @PreAuthorize("hasPermission(null, 'answer.create')")
    @PostMapping
    public ApiResponse<AnswerResponse> createAnswer(@Valid @RequestBody AnswerRequest request) {
        AnswerResponse created = answerService.create(request);
        return new ApiResponse<>(200, null, created);
    }

//    @PreAuthorize("hasPermission(null, 'answer.update')")
    @PatchMapping("/{id}")
    public ApiResponse<AnswerResponse> updateAnswer(
            @PathVariable UUID id,
            @Valid @RequestBody AnswerRequest request
    ) {
        AnswerResponse updated = answerService.update(id, request);
        return new ApiResponse<>(200, null, updated);
    }

//    @PreAuthorize("hasPermission(null, 'answer.delete')")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteAnswer(@PathVariable UUID id) {
        answerService.softDelete(id);
        return new ApiResponse<>(200, "Answer deleted successfully", null);
    }

//    @PreAuthorize("hasPermission(null, 'answer.update')")
    @PatchMapping("/{id}/toggle-active")
    public ApiResponse<AnswerResponse> toggleAnswerStatus(@PathVariable UUID id) {
        AnswerResponse updated = answerService.toggleStatus(id);
        return new ApiResponse<>(200, "Answer status updated successfully", updated);
    }
}