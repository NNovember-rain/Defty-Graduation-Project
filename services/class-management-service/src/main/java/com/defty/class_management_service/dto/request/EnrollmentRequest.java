package com.defty.class_management_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentRequest {

    @NotNull(message = "Class ID is required")
    private Long classId;

    @NotNull(message = "Student ID is required")
    private Long studentId;

}
