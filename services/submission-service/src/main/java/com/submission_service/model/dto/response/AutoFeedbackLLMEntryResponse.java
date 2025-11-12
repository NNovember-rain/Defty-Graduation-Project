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
public class AutoFeedbackLLMEntryResponse {
    Long id;
    String studentPlantUMLCode;
    String feedBackLLM;
    String studentInfo;
    LocalDateTime createdDate;
}
