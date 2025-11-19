package com.submission_service.model.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmissionFeedbackResponse {
    Long id;
    String content;
    Long teacherId;
    String fullName;
    String imageUrl;
    LocalDateTime createdDate;
    LocalDateTime updatedDate;
}
