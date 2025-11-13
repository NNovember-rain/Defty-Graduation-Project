package com.submission_service.model.dto.response;


import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.util.Map;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FeedbackLLMResponse {
    Long id;
    Long submissionId;
    Map<String, Object> feedback;
    String aiModalName;
}
