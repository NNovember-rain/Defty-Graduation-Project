package com.defty.class_management_service.controller;

import com.defty.class_management_service.dto.request.ClassRequest;
import com.defty.class_management_service.dto.response.ClassResponse;
import com.defty.class_management_service.service.IClassService;
import com.example.common_library.dto.response.PageableResponse;
import com.example.common_library.response.ApiResponse;
import com.example.common_library.utils.UserUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@Slf4j
@RequiredArgsConstructor
@RequestMapping("/class")
public class ClassController {
    private final IClassService classService;
    @PostMapping("")
    public ApiResponse<Long> createClass(@RequestBody ClassRequest classRequest) {
        return classService.createClass(classRequest);
    }
    @GetMapping("/{id}")
    public ApiResponse<ClassResponse> getClassById(@PathVariable Long id) {
        log.info("Request to get class by ID: {}", id);
        return classService.getClassById(id);
    }

    @GetMapping("")
    public ApiResponse<PageableResponse<ClassResponse>> getClasses(Pageable pageable,
                                                                   @RequestParam(name = "class_name", required = false) String className,
                                                                   @RequestParam(name = "teacher_id", required = false) Long teacherId,
                                                                   @RequestParam(name = "course_id", required = false) Long courseId,
                                                                   @RequestParam(name = "status", required = false) Integer status) {

        // ✅ Lấy thông tin user hiện tại
        UserUtils.UserInfo currentUser = UserUtils.getCurrentUser();
//        Long userId = currentUser.userId();
        log.info("user: {}", currentUser);

        // ✅ Tách role và permission
        Set<String> roles = new HashSet<>();
        Set<String> permissions = new HashSet<>();

        for (String r : currentUser.roles()) {
            if (r.startsWith("ROLE_")) {
                roles.add(r);
            } else {
                permissions.add(r);
            }
        }

        // ✅ Controller kiểm tra permission
//        if (!permissions.contains("class.view")) {
//            return new ApiResponse<>(403, "You do not have permission to view class list", null);
//        }

        return classService.getClasses(
                pageable,
                className,
                teacherId,
                courseId,
                status
        );
    }



    @GetMapping("/teacher/{teacherId}")
    public ApiResponse<PageableResponse<ClassResponse>> getClassesByTeacherId(Pageable pageable,
                                        @PathVariable Long teacherId,
                                        @RequestParam(name = "status", required = false) Integer status) {
        log.info("Request to get classes by teacher ID: {}", teacherId);
        return classService.getClassesByTeacherId(pageable, teacherId, status);
    }

    @PatchMapping("/{id}")
    public ApiResponse<Long> updateClass(@PathVariable Long id, @RequestBody ClassRequest classRequest) {
        log.info("Request to update class with ID {}: {}", id, classRequest);
        return classService.updateClass(id, classRequest);
    }

    @DeleteMapping("/{ids}")
    public ApiResponse<List<Long>> deleteClasses(@PathVariable List<Long> ids) {
        log.info("Request to delete classes with IDS {}", ids);
        return classService.deleteClass(ids);
    }
    @PatchMapping("/{id}/toggle-status")
    ApiResponse<Long> toggleActiveStatus(@PathVariable Long id) {
        return classService.toggleActiveStatus(id);
    }

    @GetMapping("/by-ids")
    public ApiResponse<Map<Long, ClassResponse>> getClassesByIds(
            @RequestParam List<Long> ids) {
        log.info("Request to get classes by IDs: {}", ids);
        return classService.getClassesByIds(ids);
    }
}
