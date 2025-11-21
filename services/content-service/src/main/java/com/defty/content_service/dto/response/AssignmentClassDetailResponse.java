package com.defty.content_service.dto.response;

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
    String moduleName;
    String moduleDescription;
    String titleAssignment;
    String assignmentDescription;
    String typeUml;
    boolean checkedTest;
    Date startDate;
    Date endDate;
}
