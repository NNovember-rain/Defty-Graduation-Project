package com.defty.class_management_service.dto.response;

import com.example.common_library.dto.response.RoleResponse;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Date;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentInClassResponse extends BaseResponse{
    private Long studentId;
    private String username;
    private String fullName;
    private String email;
    private LocalDate dob;
    private String avatarUrl;
    private String userCode; // nếu có trong UserResponse
    private Integer isActive;
    private Integer enrollmentStatus;
    private LocalDate enrollmentDate;
}