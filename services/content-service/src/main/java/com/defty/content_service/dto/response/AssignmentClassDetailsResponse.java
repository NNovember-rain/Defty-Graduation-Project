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
public class AssignmentClassDetailsResponse {
    Long moduleId;
    String moduleName;
    String moduleDescription;
    String moduleDescriptionHtml;
    List<String> typeUmls;
    boolean checkedTest;
    Long assignmentClassDetailId;
    Date startDate;
    Date endDate;
}
