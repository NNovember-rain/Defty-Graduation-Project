package com.submission_service.model.dto.response;

import com.submission_service.enums.SubmissionStatus;
import com.submission_service.model.entity.FeedbackTeacher;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SubmissionResponse {
    Long id;
    Long studentId;
    Long assignmentId;
    Long classId;
    Long moduleId;
    String moduleCode; // check trường này hiển thị ra
    String studentName;
    String studentCode;
    String classCode;
    String assignmentTitle;
    String descriptionAssignment;
    String typeUml;
    String studentPlantUMLCode;
    String solutionCode;
    Double score;
    LocalDateTime createdDate;
    boolean isfeedbackTeacher;
}
