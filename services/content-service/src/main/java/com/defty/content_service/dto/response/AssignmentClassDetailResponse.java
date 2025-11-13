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
    Long moduleId;
    String moduleName;
    String moduleDescription;
    List<String> typeUmls;
    boolean checkedTest;
    Long assignmentClassDetailId;
    Date startDate;
    Date endDate;
}
