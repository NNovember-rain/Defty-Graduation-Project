package com.submission_service.model.event;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssignmentEvent {
    Long id;
    String typeUmlName;
    String title;
    String solutionCode;
    String description;
}
