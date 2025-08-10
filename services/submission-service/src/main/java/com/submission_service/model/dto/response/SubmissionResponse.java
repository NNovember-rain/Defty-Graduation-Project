package com.submission_service.model.dto.response;

import com.submission_service.enums.SubmissionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SubmissionResponse {
    Long id;
    String studentName;
    String studentCode;
    String classCode;
    String assignmentTitle;
    String descriptionAssignment;
    String solutionCode;
    String umlType;
    Date createdDate;
    SubmissionStatus submissionStatus;
}