package com.defty.content_service.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssignmentRequest {
    Long userId;
    String title;
    String description;
    Long typeUmlId;
    List<Long> classIds;
    String assignmentCode;
    String solutionCode;
}