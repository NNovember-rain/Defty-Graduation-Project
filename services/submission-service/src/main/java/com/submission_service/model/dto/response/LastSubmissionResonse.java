package com.submission_service.model.dto.response;

import com.submission_service.enums.SubmissionStatus;
import com.submission_service.model.entity.FeedbackTeacher;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.Date;
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
    List<FeedbackTeacherResponse> feedbackTeacherResponse;
    LocalDateTime createdDate;
    SubmissionStatus submissionStatus;
}
