package com.defty.content_service.dto.response;

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
    String commonDescription;
    String commonDescriptionHtml;
    Long userId;
    String assignmentCode;
    Integer isActive;
    List<Long> classIds;
    Date createdDate;
    List<AssignmentClassResponse> assignmentClasses;
    List<ModuleResponse> modules;
}
