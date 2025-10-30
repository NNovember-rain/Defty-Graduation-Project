package com.defty.class_management_service.service;

import com.defty.class_management_service.dto.request.ClassRequest;
import com.defty.class_management_service.dto.response.ClassResponse;
import com.example.common_library.dto.response.PageableResponse;
import com.example.common_library.response.ApiResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface IClassService {
    ApiResponse<Long> createClass(ClassRequest request);
    ApiResponse getClassById(Long id);
    ApiResponse<PageableResponse<ClassResponse>> getClasses(Pageable pageable, String className, Long teacherId, Integer status);
    ApiResponse<PageableResponse<ClassResponse>> getClassesByTeacherId(Pageable pageable, Long teacherId, Integer status);
    ApiResponse<Long> updateClass(Long id, ClassRequest request);
    ApiResponse<List<Long>> deleteClass(List<Long> ids);
    ApiResponse<Long> toggleActiveStatus(Long classId);
    ApiResponse<Map<Long, ClassResponse>> getClassesByIds(List<Long> ids);



//    EnrollmentResponse enrollStudentInClass(String inviteCode, Long studentId);
//    List<EnrollmentResponse> getStudentsInClass(Long classId);
//    List<ClassResponse> getClassesByStudentId(Long studentId);
//    void leaveClass(Long classId, Long studentId);
}
