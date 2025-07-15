package com.submission_service.model.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SubmissionResponse {
    private String status;
    private String message;
}