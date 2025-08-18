package com.defty.class_management_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Date;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EnrollmentResponse {
    Long enrollmentId;
    Long studentId;
    String fullName;
    String email;
    String userCode;
    Date enrollmentDate;
}
