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
public class AssignmentClassDetailsResponse {
    Long moduleId;
    String moduleName;
    String moduleDescription;
    List<String> typeUmls;
    boolean checkedTest;
    Long assignmentClassDetailId;
    Date startDate;
    Date endDate;
}
