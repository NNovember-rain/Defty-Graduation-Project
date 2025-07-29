package com.ai_feedback_service.service;

import com.ai_feedback_service.model.dto.request.FeedbackAiRequest;

public interface IFeedBackAIService {
    Long addFeedback(FeedbackAiRequest feedbackAiRequest);
}
