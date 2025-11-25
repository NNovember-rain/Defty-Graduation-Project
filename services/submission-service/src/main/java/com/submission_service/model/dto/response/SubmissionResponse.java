package com.submission_service.model.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.submission_service.enums.SubmissionStatus;
import com.submission_service.enums.TypeUml;
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
public class  SubmissionResponse {
    Long id;
    Long studentId;
    String studentName;
    String studentCode;
    String assignmentTitle;
    String studentPlantUMLCode;
    TypeUml typeUml;
    Double score;
    LocalDateTime createdDate;
}
