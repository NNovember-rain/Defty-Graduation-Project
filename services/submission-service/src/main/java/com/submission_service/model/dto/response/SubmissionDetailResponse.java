package com.submission_service.model.dto.response;

import com.submission_service.enums.SubmissionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Date;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SubmissionDetailResponse {
    Long id;
    Long assignmentId;
    String moduleName;
    String studentName;
    String studentCode;
    String assignmentTitle;
    String descriptionAssignment;
    String descriptionModule;
    String typeUml;
    String studentPlantUMLCode;
    String solutionCode;
    Double score;
    LocalDateTime createdDate;
}
