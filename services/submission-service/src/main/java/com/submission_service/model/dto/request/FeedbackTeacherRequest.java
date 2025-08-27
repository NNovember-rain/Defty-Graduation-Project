package com.submission_service.model.dto.request;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.util.Map;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FeedbackTeacherRequest {
    private Long teacherId;
    private Long submissionId;
    private Double grade;
    private String content;
}