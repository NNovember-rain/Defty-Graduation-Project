package com.defty.class_management_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Date;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ClassResponse {
    Long id;
    Long teacherId;
    String name;
    String description;

    String section;
    String subject;
    String room;

    String inviteCode;

    Integer status;

    Date createdDate;
    String createdBy;
    Date modifiedDate;
    String modifiedBy;
}

