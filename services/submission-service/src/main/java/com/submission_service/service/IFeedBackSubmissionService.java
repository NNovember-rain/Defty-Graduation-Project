package com.submission_service.service;

import com.submission_service.model.dto.request.FeedbackSubmissionRequest;
import com.submission_service.model.dto.response.SubmissionFeedbackResponse;

import java.util.List;

public interface IFeedBackSubmissionService {
    List<SubmissionFeedbackResponse> getFeedbackSubmission(Long submissionId);
    Long addFeedbackSubmission(FeedbackSubmissionRequest feedbackSubmissionRequest);
    String updateFeedbackSubmission(Long id, FeedbackSubmissionRequest feedbackSubmissionRequest);
}
