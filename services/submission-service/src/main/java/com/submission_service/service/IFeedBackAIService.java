package com.submission_service.service;


import com.submission_service.model.dto.request.FeedbackAiRequest;
import com.submission_service.model.dto.response.FeedbackAIResponse;

public interface IFeedBackAIService {
    Long addFeedbackAI(FeedbackAiRequest feedbackAiRequest);
    FeedbackAIResponse getFeedbackAI(Long id);

}
