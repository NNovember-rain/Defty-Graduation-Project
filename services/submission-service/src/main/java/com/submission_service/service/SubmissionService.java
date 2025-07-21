package com.submission_service.service;

import com.submission_service.model.dto.request.SubmissionRequest;
import com.submission_service.model.dto.response.SubmissionResponse;

public interface SubmissionService {
    Long handleSubmission(SubmissionRequest submissionRequest);
}
