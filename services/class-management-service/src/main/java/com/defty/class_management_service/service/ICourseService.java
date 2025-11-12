package com.defty.class_management_service.service;

import com.defty.class_management_service.dto.request.CourseRequest;
import com.defty.class_management_service.dto.response.CourseResponse;
import com.example.common_library.dto.response.PageableResponse;
import com.example.common_library.response.ApiResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ICourseService {
    ApiResponse<Long> createCourse(CourseRequest courseRequest);
    ApiResponse<CourseResponse> getCourseById(Long id);
    ApiResponse<PageableResponse<CourseResponse>> getCourses(Pageable pageable,
                                                             String courseName,
                                                             Integer status);
    ApiResponse<Long> updateCourse(Long id, CourseRequest courseRequest);
    ApiResponse<List<Long>> deleteCourses(List<Long> ids);
    ApiResponse<Long> toggleActiveStatus(Long courseId);
}