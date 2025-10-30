package com.defty.class_management_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StudentImportRequest {
    String username;
    String fullName;
    String email;
    String dob;
    String userCode;
}
