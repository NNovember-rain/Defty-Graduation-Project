package com.submission_service.service;


import com.submission_service.model.dto.request.FeedbackLLMRequest;
import com.submission_service.model.dto.response.FeedbackLLMResponse;

public interface IFeedBackLLMService {
    Long addFeedbackLLM(FeedbackLLMRequest feedbackLLMRequest);
    FeedbackLLMResponse getFeedbackLLM(Long id);

}
