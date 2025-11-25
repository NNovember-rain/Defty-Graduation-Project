package com.submission_service.model.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssignmentClassDetailResponse {
    Long moduleId;
    String moduleName;
    String moduleDescription;
    String titleAssignment;
    String solutionCode;
    Long assignmentId;
    String assignmentDescription;
    String assignmentDescriptionHtml;
    String typeUml;
    boolean checkedTest;
    Date startDate;
    Date endDate;
}
