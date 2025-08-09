package com.ai_feedback_service.controller;

import com.ai_feedback_service.model.dto.request.FeedbackAiRequest;
import com.ai_feedback_service.model.dto.response.ApiResponse;
import com.ai_feedback_service.service.IFeedBackAIService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/feedback")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FeedBackController {

    IFeedBackAIService feedBackAIService;

    @PostMapping()
    public ApiResponse<Long> addFeedback(@RequestBody FeedbackAiRequest feedbackAiRequest) {
        Long id=feedBackAIService.addFeedback(feedbackAiRequest);
        return ApiResponse.<Long>builder()
                .result(id)
                .build();
    }


}
