package com.submission_service.controller;

import com.example.common_library.response.ApiResponse;
import com.submission_service.model.dto.request.FeedbackAiRequest;
import com.submission_service.model.dto.request.FeedbackTeacherRequest;
import com.submission_service.model.dto.response.FeedbackAIResponse;
import com.submission_service.model.dto.response.FeedbackTeacherResponse;
import com.submission_service.model.entity.FeedbackTeacher;
import com.submission_service.service.IFeedBackAIService;
import com.submission_service.service.IFeedBackTeacherService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/submission/feedback")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FeedBackController {

    IFeedBackAIService feedBackAIService;
    IFeedBackTeacherService feedBackTeacherService;

    @PostMapping("/llm")
    public ApiResponse<Long> addFeedbackAI(@RequestBody FeedbackAiRequest feedbackAiRequest) {
        Long id=feedBackAIService.addFeedbackAI(feedbackAiRequest);
        return ApiResponse.<Long>builder()
                .result(id)
                .build();
    }

    @GetMapping("/llm/{id}")
    public ApiResponse<FeedbackAIResponse> getFeedbackAI(@PathVariable Long id) {
        FeedbackAIResponse feedbackAIResponse = feedBackAIService.getFeedbackAI(id);
        return ApiResponse.<FeedbackAIResponse>builder()
                .result(feedbackAIResponse)
                .build();
    }

    @PostMapping("/teacher")
    public ApiResponse<Long> addFeedbackTeacher(@RequestBody FeedbackTeacherRequest feedbackTeacherRequest) {
        Long id= feedBackTeacherService.addFeedbackTeacher(feedbackTeacherRequest);
        return ApiResponse.<Long>builder()
                .result(id)
                .build();
    }

    @PatchMapping("/teacher/{id}")
    public ApiResponse<String> updateFeedbackTeacher(@PathVariable Long id, @RequestBody FeedbackTeacherRequest feedbackTeacherRequest) {
        String message= feedBackTeacherService.updateFeedbackTeacher(id,feedbackTeacherRequest);
        return ApiResponse.<String>builder()
                .result(message)
                .build();
    }

    @GetMapping("/teacher/{submissionId}")
    public ApiResponse<List<FeedbackTeacherResponse>> getFeedbackTeacher(@PathVariable Long submissionId) {
        List<FeedbackTeacherResponse> feedbackTeacherResponses= feedBackTeacherService.getFeedbackTeacher(submissionId);
        return ApiResponse.<List<FeedbackTeacherResponse>>builder()
                .result(feedbackTeacherResponses)
                .build();
    }
}
