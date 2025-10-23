package com.submission_service.model.dto.request;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmissionRequest {
    Long classId;
    Long assignmentId;
    String studentPlantUmlCode;
    Boolean examMode;
}
