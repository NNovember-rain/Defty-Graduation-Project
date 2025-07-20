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
    private Integer studentId;
    private Integer assignmentId;
    private String studentPlantUmlCode;
    private String solutionUmlCode;
//    private MultipartFile plantUmlFile;
}
