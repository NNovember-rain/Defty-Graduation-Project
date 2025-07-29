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
    Long studentId;
    String studentName;
    Long classId;
    String className;
    Long assignmentId;
    String assignmentTitle;
    String studentPlantUmlCode;

//    private MultipartFile plantUmlFile;
}
