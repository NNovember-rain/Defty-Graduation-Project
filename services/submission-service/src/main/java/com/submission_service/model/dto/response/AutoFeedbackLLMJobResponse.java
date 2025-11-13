package com.submission_service.model.dto.response;

import com.submission_service.enums.TypeUml;
import com.submission_service.model.entity.AutoFeedbackLLMEntry;
import jakarta.persistence.*;
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
public class AutoFeedbackLLMJobResponse {
    Long id;
    String title;
    TypeUml typeUml;
    String assignment;
    String solutionCode;
    LocalDateTime createdDate;
}
