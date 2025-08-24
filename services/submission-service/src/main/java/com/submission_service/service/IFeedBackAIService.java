package com.submission_service.service;


import com.submission_service.model.dto.request.FeedbackAiRequest;
import com.submission_service.model.dto.request.FeedbackTeacherRequest;
import com.submission_service.model.dto.response.FeedbackAIResponse;
import com.submission_service.model.dto.response.FeedbackTeacherResponse;

public interface IFeedBackAIService {
    Long addFeedbackAI(FeedbackAiRequest feedbackAiRequest);
    FeedbackAIResponse getFeedbackAI(Long id);

}
