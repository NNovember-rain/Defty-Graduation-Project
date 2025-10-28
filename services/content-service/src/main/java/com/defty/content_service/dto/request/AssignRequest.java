package com.defty.content_service.dto.request;

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
public class AssignRequest {
    List<Long> classIds;
    List<Long> assignmentIds;
    List<Long> moduleIds;
    Date startDate;
    Date endDate;
}
