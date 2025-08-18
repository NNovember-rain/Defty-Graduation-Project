package com.submission_service.model.buider;

import com.submission_service.enums.SubmissionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class SubmissionSearchBuilder {
    String studentName;
    String studentCode;
    String assignmentTitle;
    String umlType;
    String className;
    String classCode;
    SubmissionStatus submissionStatus;
    LocalDate fromDate;
    LocalDate toDate;
}
