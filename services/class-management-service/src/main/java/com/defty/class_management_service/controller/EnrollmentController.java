package com.defty.class_management_service.controller;

import com.defty.class_management_service.service.IEnrollmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@Slf4j
@RequiredArgsConstructor
@RequestMapping("/enrollment")
public class EnrollmentController {
    IEnrollmentService enrollmentService;
//    @PostMapping("/add-students")
//    public ResponseEntity<ApiResponse<List<EnrollmentDto>>> addStudentsToClass(
//            @PathVariable Long classId,
//            @Valid @RequestBody AddStudentsRequest request) {
//        log.info("Request to add students to class {}: {}", classId, request.getStudentIds());
//        ApiResponse<List<EnrollmentDto>> response = classService.addStudentsToClass(classId, request);
//
//        if (response.isSuccess()) {
//            return new ResponseEntity<>(response, HttpStatus.CREATED);
//        } else {
//            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
//        }
//    }
    @GetMapping("/students")
    public Object getStudentsInClass(@PathVariable Long classId) {
        log.info("Request to get students in class: {}", classId);

        return null;
    }
    @GetMapping("/student/{studentId}/classes")
    public Object getClassesByStudentId(Pageable pageable,
                                        @PathVariable Long studentId) {
        log.info("Request to get classes by student ID: {}", studentId);
        return enrollmentService.getClassesByStudentId(pageable, studentId);
    }

//    @DeleteMapping("/students/{studentId}/leave")
//    public ResponseEntity<ApiResponse<Void>> leaveClass(@PathVariable Long classId, @PathVariable Long studentId) {
//        log.info("Request for student {} to leave class {}", studentId, classId);
//        classService.leaveClass(classId, studentId);
//        return ResponseEntity.ok(ApiResponse.success(null, "Student successfully left the class"));
//    }
}
