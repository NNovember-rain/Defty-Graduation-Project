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
public class AssignmentClassDetailResponse {
    Long assignmentId;
    String assignmentTitle;
    String assignmentDescription;
    String assignmentCode;
    Long classId;
    Long assignmentClassId;

    Date startDate;
    Date endDate;
    boolean checkedTest;

    List<ModuleClassResponse> modules;
}
