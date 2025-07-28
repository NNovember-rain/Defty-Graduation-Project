package com.submission_service.model.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SubmissionResponse {
    Long submissionId;
    private String status;
    private String message;
}