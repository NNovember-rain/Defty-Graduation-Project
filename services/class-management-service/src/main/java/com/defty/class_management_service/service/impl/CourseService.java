package com.defty.class_management_service.service.impl;
import com.defty.class_management_service.dto.request.CourseRequest;
import com.defty.class_management_service.dto.response.CourseResponse;
import com.defty.class_management_service.entity.CourseEntity;
import com.defty.class_management_service.mapper.CourseMapper;
import com.defty.class_management_service.repository.ICourseRepository;
import com.defty.class_management_service.service.ICourseService;
import com.defty.class_management_service.validation.CourseValidation;
import com.example.common_library.dto.response.PageableResponse;
import com.example.common_library.exceptions.FieldRequiredException;
import com.example.common_library.exceptions.NotFoundException;
import com.example.common_library.exceptions.ValidationException;
import com.example.common_library.response.ApiResponse;
import com.example.common_library.utils.CopyUtil;
import com.example.common_library.utils.UserUtils;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CourseService implements ICourseService {

    CourseValidation courseValidation;
    CourseMapper courseMapper;
    ICourseRepository courseRepository;

    @Override
    @Transactional
    public ApiResponse<Long> createCourse(CourseRequest courseRequest) {
        log.info("Request received to create course: {}", courseRequest.getCourseName());

        try {
            // 1. Validate required fields
            courseValidation.fieldValidation(courseRequest, null);

            // 2. Map DTO -> Entity
            CourseEntity courseEntity = courseMapper.toCourseEntity(courseRequest);

            // 3. Save to database (Lưu Course trước)
            courseEntity = courseRepository.save(courseEntity);
            log.info("Course '{}' saved successfully with ID: {}", courseEntity.getCourseName(), courseEntity.getId());

            return new ApiResponse<>(201, "Tạo khóa học thành công.", courseEntity.getId());

        } catch (FieldRequiredException | ValidationException e) {
            log.warn("Validation failed for course creation: {}", e.getMessage());
            return new ApiResponse<>(400, e.getMessage(), null);
        } catch (DataAccessException e) {
            log.error("Database error occurred while saving course '{}': {}", courseRequest.getCourseName(), e.getMessage(), e);
            return new ApiResponse<>(500, "Lỗi cơ sở dữ liệu khi lưu khóa học.", null);
        } catch (Exception e) {
            log.error("Unexpected error while creating course '{}': {}", courseRequest.getCourseName(), e.getMessage(), e);
            return new ApiResponse<>(500, "Có lỗi bất ngờ xảy ra khi tạo khóa học.", null);
        }
    }

    @Override
    public ApiResponse<CourseResponse> getCourseById(Long id) {
        // Lấy user hiện tại
        UserUtils.UserInfo currentUser = UserUtils.getCurrentUser();
        Long currentUserId = currentUser.userId();
        log.info("currentUser: {}", currentUser);

        // Tách role
        Set<String> roles = currentUser.roles().stream()
                .filter(r -> r.startsWith("ROLE_"))
                .collect(Collectors.toSet());

        Optional<CourseEntity> courseEntityOpt;

        if (roles.contains("ROLE_admin") || roles.contains("ROLE_system-admin")) {
            courseEntityOpt = courseRepository.findActiveById(id);
        } else if (roles.contains("ROLE_teacher") || roles.contains("ROLE_ta") || roles.contains("ROLE_student")) {
            // Chỉ hiển thị khóa học active
            courseEntityOpt = courseRepository.findActiveById(id);
            if (courseEntityOpt.isPresent() && courseEntityOpt.get().getStatus() != 1) {
                courseEntityOpt = Optional.empty();
            }
        } else {
            return new ApiResponse<>(403, "Bạn không có quyền xem thông tin khóa học này", null);
        }

        if (courseEntityOpt.isEmpty()) {
            throw new NotFoundException(
                    "Không tìm thấy khóa học hoặc bạn không có quyền truy cập. course id: " + id);
        }

        CourseResponse courseResponse = courseMapper.toCourseResponse(courseEntityOpt.get());
        return new ApiResponse<>(200, "Lấy thông tin khóa học thành công", courseResponse);
    }

    @Override
    public ApiResponse<PageableResponse<CourseResponse>> getCourses(Pageable pageable,
                                                                    String courseName,
                                                                    Integer status) {

        // Lấy user hiện tại
        UserUtils.UserInfo currentUser = UserUtils.getCurrentUser();
        log.info("currentUser: {}", currentUser);

        Set<String> roles = currentUser.roles().stream()
                .filter(r -> r.startsWith("ROLE_"))
                .collect(Collectors.toSet());

        Pageable sortedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by("createdDate").descending()
        );

        Page<CourseEntity> courseEntities;

        if (roles.contains("ROLE_admin") || roles.contains("ROLE_system-admin")) {
            courseEntities = courseRepository.findCoursesWithMappings(courseName, status, sortedPageable);
        } else if (roles.contains("ROLE_teacher") || roles.contains("ROLE_ta") || roles.contains("ROLE_student")) {
            courseEntities = courseRepository.findCoursesWithMappings(courseName, 1, sortedPageable);
        } else {
            return new ApiResponse<>(403, "Bạn không có quyền xem danh sách khóa học", null);
        }

        List<CourseResponse> courseResponses = courseEntities.getContent().stream()
                .map(courseMapper::toCourseResponse)
                .collect(Collectors.toList());

        PageableResponse<CourseResponse> pageableResponse =
                new PageableResponse<>(courseResponses, courseEntities.getTotalElements());

        return new ApiResponse<>(200, "OK", pageableResponse);
    }


    @Transactional
    @Override
    public ApiResponse<Long> updateCourse(Long id, CourseRequest courseRequest) {
        try {
            courseValidation.fieldValidation(courseRequest, id);

            // 1. Find existing course
            Optional<CourseEntity> courseEntityOpt = courseRepository.findActiveById(id);
            if (!courseEntityOpt.isPresent()) {
                throw new NotFoundException("Khóa học không tồn tại hoặc đã bị xóa, course id: " + id);
            }

            CourseEntity updatedCourse = courseEntityOpt.get();

            // 2. Copy properties
            CopyUtil.copyPropertiesIgnoreNull(courseRequest, updatedCourse);

            // 3. Save updated course (Lưu các thay đổi cơ bản của Course)
            CourseEntity savedCourse = courseRepository.save(updatedCourse);

            return new ApiResponse<>(200, "Cập nhật khóa học thành công", savedCourse.getId());

        } catch (NotFoundException e) {
            throw e;
        } catch (ValidationException e) {
            return new ApiResponse<>(400, "Validation error: " + e.getMessage(), id);
        } catch (Exception e) {
            log.error("Error updating course with id: " + id, e);
            return new ApiResponse<>(500, "Internal server error: " + e.getMessage(), id);
        }
    }

    @Override
    public ApiResponse<List<Long>> deleteCourses(List<Long> ids) {
        List<CourseEntity> courseEntities = courseRepository.findAllById(ids);
        if (courseEntities.size() == 0) {
            throw new NotFoundException("No course found for deleting");
        }

        for (CourseEntity x : courseEntities) {
            x.setStatus(-1);
        }

        courseRepository.saveAll(courseEntities);

        if (ids.size() > 1) {
            return new ApiResponse<>(200, "Xóa các khóa học thành công", ids);
        }
        return new ApiResponse<>(200, "Xóa khóa học thành công", ids);
    }

    @Override
    public ApiResponse<Long> toggleActiveStatus(Long courseId) {
        CourseEntity courseEntity = courseRepository.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found with ID: " + courseId));

        Integer status = courseEntity.getStatus();
        if (status == 1) {
            courseEntity.setStatus(0);
        } else if (status == 0) {
            courseEntity.setStatus(1);
        }

        courseRepository.save(courseEntity);
        return new ApiResponse<>(200, "Cập nhật trạng thái khóa học thành công", courseEntity.getId());
    }
}
