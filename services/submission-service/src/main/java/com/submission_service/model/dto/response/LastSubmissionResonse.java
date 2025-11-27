package com.submission_service.model.dto.response;

import com.submission_service.enums.SubmissionStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LastSubmissionResonse {
    Long id;
    String studentPlantUMLCode;
    Double score;
    List<SubmissionFeedbackResponse> submissionFeedbackResponse;
    LocalDateTime createdDate;
    SubmissionStatus submissionStatus;
}
