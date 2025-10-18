package com.submission_service.service;

import com.submission_service.model.dto.request.FeedbackTeacherRequest;
import com.submission_service.model.dto.response.FeedbackTeacherResponse;

import java.util.List;

public interface IFeedBackTeacherService {
    List<FeedbackTeacherResponse> getFeedbackTeacher(Long submissionId);
    Long addFeedbackTeacher(FeedbackTeacherRequest feedbackTeacherRequest);
    String updateFeedbackTeacher(Long id, FeedbackTeacherRequest feedbackTeacherRequest);
}
