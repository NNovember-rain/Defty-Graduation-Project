package com.submission_service.model.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.submission_service.enums.SubmissionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SubmissionResponse {
    Long id;
    Long studentId;
    Long assignmentId;
    Long moduleId;
    String moduleName;
    String studentName;
    String studentCode;
    String classCode;
    String assignmentTitle;
    String descriptionAssignment;
    String descriptionModule;
    String typeUml;
    String studentPlantUMLCode;
    String solutionCode;
    Double score;
    LocalDateTime createdDate;
    boolean isfeedbackTeacher;
    SubmissionStatus submissionStatus;
}
