package com.submission_service.service;


import com.submission_service.model.dto.request.FeedbackAiRequest;

public interface IFeedBackAIService {
    Long addFeedback(FeedbackAiRequest feedbackAiRequest);
}
