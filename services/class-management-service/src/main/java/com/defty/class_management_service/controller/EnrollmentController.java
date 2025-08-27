package com.defty.class_management_service.controller;

import com.defty.class_management_service.dto.response.ClassOfStudentResponse;
import com.defty.class_management_service.dto.response.ClassResponse;
import com.defty.class_management_service.service.IEnrollmentService;
import com.example.common_library.dto.response.PageableResponse;
import com.example.common_library.response.ApiResponse;
import com.example.common_library.service.ExternalServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@Slf4j
@RequiredArgsConstructor
@RequestMapping("/enrollment")
public class EnrollmentController {
    private final IEnrollmentService enrollmentService;
    @GetMapping("/class/{classId}/students")
    public Object getStudentsInClass(@PathVariable Long classId,
                                     Pageable pageable) {
        log.info("Request to get students in class: {}", classId);
        return enrollmentService.getStudentsInClass(pageable, classId);
    }
    @GetMapping("/student/{studentId}/classes")
    public ApiResponse<PageableResponse<ClassOfStudentResponse>> getClassesByStudentId(Pageable pageable,
                                                                                       @PathVariable Long studentId) {
        log.info("Request to get classes by student ID: {}", studentId);
        return enrollmentService.getClassesByStudentId(pageable, studentId);
    }

}
