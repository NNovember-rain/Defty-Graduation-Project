package com.defty.class_management_service.controller;

import com.defty.class_management_service.dto.request.CourseRequest;
import com.defty.class_management_service.dto.response.CourseResponse;
import com.defty.class_management_service.service.ICourseService;
import com.example.common_library.dto.response.PageableResponse;
import com.example.common_library.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Slf4j
@RequiredArgsConstructor
@RequestMapping("/course")
public class CourseController {

    private final ICourseService courseService;

    @PostMapping("")
//    @PreAuthorize("hasPermission(null, 'course.create')")
    public ApiResponse<Long> createCourse(@RequestBody CourseRequest courseRequest) {
        return courseService.createCourse(courseRequest);
    }

    @GetMapping("/{id}")
    public ApiResponse<CourseResponse> getCourseById(@PathVariable Long id) {
        log.info("Request to get course by ID: {}", id);
        return courseService.getCourseById(id);
    }

    @GetMapping("")
//    @PreAuthorize("hasPermission(null, 'course.view')")
    public ApiResponse<PageableResponse<CourseResponse>> getCourses(
            Pageable pageable,
            @RequestParam(name = "course_name", required = false) String courseName,
            @RequestParam(name = "status", required = false) Integer status) {
        log.info("Request to get courses with filters");
        return courseService.getCourses(pageable, courseName, status);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'course.update')")
    public ApiResponse<Long> updateCourse(@PathVariable Long id, @RequestBody CourseRequest courseRequest) {
        log.info("Request to update course with ID {}: {}", id, courseRequest);
        return courseService.updateCourse(id, courseRequest);
    }

    @DeleteMapping("/{ids}")
    @PreAuthorize("hasPermission(null, 'course.delete')")
    public ApiResponse<List<Long>> deleteCourses(@PathVariable List<Long> ids) {
        log.info("Request to delete courses with IDs {}", ids);
        return courseService.deleteCourses(ids);
    }

    @PatchMapping("/toggle-status/{id}")
    @PreAuthorize("hasPermission(null, 'course.toggle.status')")
    public ApiResponse<Long> toggleActiveStatus(@PathVariable Long id) {
        return courseService.toggleActiveStatus(id);
    }

}