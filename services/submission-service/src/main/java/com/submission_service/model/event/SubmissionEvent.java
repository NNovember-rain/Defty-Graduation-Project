package com.submission_service.model.event;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmissionEvent {

    Long id;
    String accessToken;
    String typeUmlName;
    String contentAssignment;
    String solutionPlantUmlCode;
    String studentPlantUmlCode;

}
