package com.submission_service.controller;

import com.example.common_library.response.ApiResponse;
import com.submission_service.model.dto.request.FeedbackLLMRequest;
import com.submission_service.model.dto.request.FeedbackSubmissionRequest;
import com.submission_service.model.dto.response.FeedbackLLMResponse;
import com.submission_service.model.dto.response.SubmissionFeedbackResponse;
import com.submission_service.service.IFeedBackLLMService;
import com.submission_service.service.IFeedBackSubmissionService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/submission/feedback")
@RequiredArgsConstructor
@Validated
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SubmissionFeedBackController {

    IFeedBackLLMService feedBackLLMService;
    IFeedBackSubmissionService feedBackSubmissionService;

    @PostMapping("/accessible/llm")
    public ApiResponse<Long> addFeedbackAI(@RequestBody FeedbackLLMRequest feedbackLLMRequest) {
        Long id=feedBackLLMService.addFeedbackLLM(feedbackLLMRequest);
        return ApiResponse.<Long>builder()
                .result(id)
                .build();
    }

    @GetMapping("/llm/{id}")
    public ApiResponse<FeedbackLLMResponse> getFeedbackAI(@PathVariable Long id) {
        FeedbackLLMResponse feedbackLLMResponse = feedBackLLMService.getFeedbackLLM(id);
        return ApiResponse.<FeedbackLLMResponse>builder()
                .result(feedbackLLMResponse)
                .build();
    }

    @PostMapping("/teacher")
    public ApiResponse<Long> addFeedbackSubmission(@RequestBody @Valid FeedbackSubmissionRequest feedbackSubmissionRequest) {
        Long id= feedBackSubmissionService.addFeedbackSubmission(feedbackSubmissionRequest);
        return ApiResponse.<Long>builder()
                .result(id)
                .build();
    }

    @PatchMapping("/teacher/{id}")
    public ApiResponse<String> updateFeedbackSubmission(@PathVariable Long id, @RequestBody FeedbackSubmissionRequest feedbackSubmissionRequest) {
        String message= feedBackSubmissionService.updateFeedbackSubmission(id, feedbackSubmissionRequest);
        return ApiResponse.<String>builder()
                .result(message)
                .build();
    }

    @GetMapping("/teacher/{submissionId}")
    public ApiResponse<List<SubmissionFeedbackResponse>> getFeedbackSubmission(@PathVariable Long submissionId) {
        List<SubmissionFeedbackResponse> feedbackSubmissionRespons = feedBackSubmissionService.getFeedbackSubmission(submissionId);
        return ApiResponse.<List<SubmissionFeedbackResponse>>builder()
                .result(feedbackSubmissionRespons)
                .build();
    }
}
