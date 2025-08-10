package com.submission_service.model.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Date;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssignmentResponse {
    Long id;
    String title;
    String description;
    Long userId;
    String typeUmlName;
    String solutionCode;
    String assignmentCode;
    Integer isActive;
    List<Long> classIds;
    Date createdDate;
}