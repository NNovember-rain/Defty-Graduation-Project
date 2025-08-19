package com.submission_service.controller;

import com.example.common_library.response.ApiResponse;
import com.submission_service.model.dto.request.FeedbackAiRequest;
import com.submission_service.model.dto.request.FeedbackTeacherRequest;
import com.submission_service.model.dto.response.FeedbackAIResponse;
import com.submission_service.service.IFeedBackAIService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/submission/feedback")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FeedBackController {

    IFeedBackAIService feedBackAIService;

    @PostMapping("/llm")
    public ApiResponse<Long> addFeedbackAI(@RequestBody FeedbackAiRequest feedbackAiRequest) {
        Long id=feedBackAIService.addFeedback(feedbackAiRequest);
        return ApiResponse.<Long>builder()
                .result(id)
                .build();
    }

//    @PostMapping("/llm")
//    public ApiResponse<Long> addFeedbackAI(@RequestBody FeedbackTeacherRequest feedbackTeacherRequest) {
//        Long id=feedBackAIService.addFeedback(feedbackTeacherRequest);
//        return ApiResponse.<Long>builder()
//                .result(id)
//                .build();
//    }

//    @GetMapping("/llm/submission-id")
//    public ApiResponse<FeedbackAIResponse> getFeedbackAI(@PathVariable Long id) {
//
//    }


}
