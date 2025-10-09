package com.defty.class_management_service.controller;

import com.defty.class_management_service.dto.response.ClassOfStudentResponse;
import com.defty.class_management_service.dto.response.ClassResponse;
import com.defty.class_management_service.dto.response.StudentImportRequest;
import com.defty.class_management_service.service.IEnrollmentService;
import com.example.common_library.dto.response.PageableResponse;
import com.example.common_library.response.ApiResponse;
import com.example.common_library.service.ExternalServiceClient;
import com.example.common_library.utils.UserUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    @GetMapping("/student/classes")
    public ApiResponse<PageableResponse<ClassOfStudentResponse>> getClassesByStudentId(Pageable pageable) {
        UserUtils.UserInfo currentUser = UserUtils.getCurrentUser();
        Long studentId = currentUser.userId();
        log.info("Request to get classes by student ID: {}", studentId);
        return enrollmentService.getClassesByStudentId(pageable, studentId);
    }

    @PostMapping("/class/{classId}/import")
    public ApiResponse<?> importStudentsToClass(
            @PathVariable Long classId,
            @RequestBody List<StudentImportRequest> students) {
        log.info("Request to import {} students to class {}", students.size(), classId);

        try {
            enrollmentService.importStudentsToClass(classId, students);
            return ApiResponse.builder()
                    .result("Import successful")
                    .build();
        } catch (Exception e) {
            log.error("Failed to import students to class {}: {}", classId, e.getMessage(), e);
            return ApiResponse.builder()
                    .result("Failed to import students to class")
                    .build();
        }
    }
}
