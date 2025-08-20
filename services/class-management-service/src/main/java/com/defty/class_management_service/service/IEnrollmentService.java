package com.defty.class_management_service.service;

import com.defty.class_management_service.dto.response.ClassOfStudentResponse;
import com.defty.class_management_service.dto.response.ClassResponse;
import com.example.common_library.dto.response.PageableResponse;
import com.example.common_library.response.ApiResponse;
import org.springframework.data.domain.Pageable;

public interface IEnrollmentService {
    ApiResponse<PageableResponse<ClassOfStudentResponse>> getClassesByStudentId(Pageable pageable, Long studentId);
    ApiResponse<Object> getStudentsInClass(Pageable pageable, Long classId);
}
