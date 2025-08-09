package com.defty.class_management_service.service;

import com.defty.class_management_service.dto.request.ClassRequest;
import com.defty.class_management_service.dto.response.ClassResponse;
import com.defty.class_management_service.dto.response.EnrollmentResponse;
import com.example.common_library.dto.response.ApiResponse;
import com.example.common_library.dto.response.PageableResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface IClassService {
    ApiResponse<Long> createClass(ClassRequest request);
    Object getClassById(Long id);
    ApiResponse<PageableResponse<ClassResponse>> getClasses(Pageable pageable, String className, Long teacherId, Integer status);
    ApiResponse<PageableResponse<ClassResponse>> getClassesByTeacherId(Pageable pageable, Long teacherId, Integer status);
    ApiResponse<Long> updateClass(Long id, ClassRequest request);
    ApiResponse<List<Long>> deleteClass(List<Long> ids);
    ApiResponse<Long> toggleActiveStatus(Long classId);


//    EnrollmentResponse enrollStudentInClass(String inviteCode, Long studentId);
//    List<EnrollmentResponse> getStudentsInClass(Long classId);
//    List<ClassResponse> getClassesByStudentId(Long studentId);
//    void leaveClass(Long classId, Long studentId);
}
