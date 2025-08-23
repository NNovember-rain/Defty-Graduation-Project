package com.submission_service.service;

import com.submission_service.model.dto.request.FeedbackTeacherRequest;
import com.submission_service.model.dto.response.FeedbackTeacherResponse;

public interface IFeedBackTeacherService {
    FeedbackTeacherResponse getFeedbackTeacher(Long id);
    Long addFeedbackTeacher(FeedbackTeacherRequest feedbackTeacherRequest);
    String updateFeedbackTeacher(Long id, FeedbackTeacherRequest feedbackTeacherRequest);
}
