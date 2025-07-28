package com.submission_service.service;

import com.submission_service.model.dto.request.SubmissionRequest;

public interface SubmissionService {
    Long handleSubmission(SubmissionRequest submissionRequest);
}
