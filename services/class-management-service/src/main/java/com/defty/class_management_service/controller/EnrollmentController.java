package com.defty.class_management_service.controller;

import com.defty.class_management_service.dto.request.EnrollmentRequest;
import com.defty.class_management_service.dto.request.UpdateStudentStatusRequest;
import com.defty.class_management_service.dto.response.StudentInClassResponse;
import com.defty.class_management_service.service.IEnrollmentService;
import com.example.common_library.dto.response.PageableResponse;
import com.example.common_library.response.ApiResponse;
import com.example.common_library.utils.UserUtils;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/enrollment")
public class EnrollmentController {
    IEnrollmentService enrollmentService;

    @PostMapping("/{classId}/student")
    public ApiResponse<Object> enrollStudent(@PathVariable Long classId,
                                             @Valid @RequestBody EnrollmentRequest request) {
        log.info("Request to enroll student {} into class: {}", request.getStudentId(), classId);
        return enrollmentService.enrollStudent(classId, request.getStudentId());
    }

    @GetMapping("/{classId}/students")
    public ApiResponse<PageableResponse<StudentInClassResponse>> getStudentsInClass(
            @PathVariable Long classId,
            Pageable pageable
    ) {
        log.info("Request to get students in class: {} by user: {}", classId);
        return enrollmentService.getStudentsInClass(pageable, classId);
    }


    @PostMapping("/join/{inviteCode}")
    public ApiResponse<Object> joinClassByInvite(@PathVariable String inviteCode) {

        UserUtils.UserInfo currentUser = UserUtils.getCurrentUser();
        Long studentId = currentUser.userId();

        log.info("Request to join class by invite code: {} for studentId: {}", inviteCode, studentId);

        return enrollmentService.joinClassByInvite(inviteCode, studentId);
    }


    @PatchMapping("/class/{classId}/student/{studentId}/status")
//    @PreAuthorize("hasPermission(null, 'class.enrollment.update.status')")
    public ApiResponse<Object> updateStudentStatus(@PathVariable Long classId,
                                                   @PathVariable Long studentId,
                                                   @Valid @RequestBody UpdateStudentStatusRequest request) {
        log.info("Request to update status for student {} in class {} to: {} by user: {}");
        return enrollmentService.updateEnrollmentStatus(classId, studentId, request.getStatus());
    }

//    @PatchMapping("/class/{classId}/leave")
//    public ApiResponse<Object> leaveClass(@PathVariable Long classId,
//                                          @RequestParam Long studentId) {
//        log.info("Request for student {} to leave class: {} by user: {}",
//                studentId, classId);
//        return enrollmentService.leaveClass(classId, studentId);
//    }

    @GetMapping("/{classId}/student-ids")
    public ApiResponse<List<Long>> getStudentsInClass(@PathVariable Long classId) {
        log.info("Request to get students in class: {} by user: {}", classId);
        return enrollmentService.getStudentsInClass(classId);
    }
}