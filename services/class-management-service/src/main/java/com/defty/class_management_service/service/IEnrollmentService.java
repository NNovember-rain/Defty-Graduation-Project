package com.defty.class_management_service.service;

import com.defty.class_management_service.dto.response.ClassOfStudentResponse;
import com.defty.class_management_service.dto.response.StudentInClassResponse;
import com.example.common_library.dto.response.PageableResponse;
import com.example.common_library.response.ApiResponse;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface IEnrollmentService {
    ApiResponse<Object> enrollStudent(Long classId, Long studentId);
    ApiResponse<Object> removeStudentFromClass(Long classId, List<Long> studentId);
    ApiResponse<PageableResponse<ClassOfStudentResponse>> getClassesByStudentId(Pageable pageable, Long studentId);
    ApiResponse<PageableResponse<StudentInClassResponse>> getStudentsInClass(Pageable pageable, Long classId);
    @Transactional
    ApiResponse<Object> updateEnrollmentStatus(Long classId, Long studentId, Integer status);
    ApiResponse<Object> joinClassByInvite(String inviteCode, Long studentId);
    ApiResponse<Object> leaveClass(Long classId, Long studentId);
    ApiResponse<List<Long>> getStudentsInClass( Long classId);
}
