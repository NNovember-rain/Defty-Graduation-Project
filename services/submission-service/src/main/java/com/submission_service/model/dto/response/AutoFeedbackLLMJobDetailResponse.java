package com.submission_service.model.dto.response;

import com.submission_service.enums.TypeUml;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AutoFeedbackLLMJobDetailResponse {
    String title;
    TypeUml typeUml;
    String assignment;
    String solutionCode;
    List<AutoFeedbackLLMEntryResponse> entries;
}
