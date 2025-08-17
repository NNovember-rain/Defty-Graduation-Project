package com.submission_service.model.event;

import com.submission_service.model.entity.Submission;
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
    String acessToken;
    String typeUmlName;
    String contentAssignment;
    String solutionPlantUmlCode;
    String studentPlantUmlCode;

}
