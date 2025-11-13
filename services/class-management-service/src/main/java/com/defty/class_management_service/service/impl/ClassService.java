package com.defty.class_management_service.service.impl;

import com.defty.class_management_service.dto.request.ClassRequest;
import com.defty.class_management_service.dto.response.ClassResponse;
import com.defty.class_management_service.entity.ClassEntity;
import com.defty.class_management_service.entity.CourseEntity;
import com.defty.class_management_service.mapper.ClassMapper;
import com.defty.class_management_service.repository.IClassRepository;
import com.defty.class_management_service.repository.ICourseRepository;
import com.defty.class_management_service.service.IClassService;
import com.defty.class_management_service.utils.InviteCodeUtil;
import com.defty.class_management_service.validation.ClassValidation;
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

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ClassService implements IClassService {
    ClassValidation classValidation;
    ClassMapper classMapper;
    IClassRepository classRepository;
    ICourseRepository courseRepository;
    InviteCodeUtil inviteCodeUtil;
//    ClassEnrollmentRepository enrollmentRepository;

    @Override
    public ApiResponse<Long> createClass(ClassRequest classRequest) {
        log.info("Request received to create class: {}", classRequest.getClassName());

        try {
            // 1. Validate required fields
            classValidation.fieldValidation(classRequest);

            // 2. Validate course
            CourseEntity courseEntity = null;
            if (classRequest.getCourseId() != null) {
                courseEntity = courseRepository.findActiveById(classRequest.getCourseId())
                        .orElseThrow(() -> new NotFoundException("Khoá học không tồn tại hoặc đã bị xóa, courseId: " + classRequest.getCourseId()));
            }

            // 3. Map DTO -> Entity
            ClassEntity classEntity = classMapper.toClassEntity(classRequest);

            // 4. Gắn course
            classEntity.setCourseEntity(courseEntity);

            // 5. Auto create inviteCode (unique)
            String inviteCode = inviteCodeUtil.generateUniqueInviteCode();
            classEntity.setInviteCode(inviteCode);

            // 6. Save DB
            classEntity = classRepository.save(classEntity);
            log.info("Class '{}' saved successfully with ID: {}", classEntity.getClassName(), classEntity.getId());

            return new ApiResponse<>(201, "Tạo lớp học thành công.", classEntity.getId());

        } catch (FieldRequiredException e) {
            log.warn("Validation failed for class creation: {}", e.getMessage());
            return new ApiResponse<>(400, e.getMessage(), null);
        } catch (DataAccessException e) {
            log.error("Database error occurred while saving class '{}': {}", classRequest.getClassName(), e.getMessage(), e);
            return new ApiResponse<>(500, "Lỗi cơ sở dữ liệu khi lưu lớp học.", null);
        } catch (Exception e) {
            log.error("Unexpected error while creating class '{}': {}", classRequest.getClassName(), e.getMessage(), e);
            return new ApiResponse<>(500, "Có lỗi bất ngờ xảy ra khi tạo lớp học.", null);
        }
    }
    @Override
    public ApiResponse<ClassResponse> getClassById(Long id) {
        UserUtils.UserInfo currentUser = UserUtils.getCurrentUser();
        Long currentUserId = currentUser.userId();
        Set<String> roles = new HashSet<>(currentUser.roles());

        log.info("Current User: {}", currentUser);

        Optional<ClassEntity> classEntityOpt;

        if (roles.contains("ROLE_admin")) {
            classEntityOpt = classRepository.findActiveById(id);

        } else if (roles.contains("ROLE_teacher")) {
            // Teacher chỉ xem lớp được gán + status = 1
            classEntityOpt = classRepository.findByActiveByTeacherId(id, currentUserId);

        } else if (roles.contains("ROLE_student")) {
            // Student chỉ xem lớp nếu đã được phê duyệt
            classEntityOpt = classRepository.findApprovedClassByStudentId(id, currentUserId);

        } else {
//            throw new ForbiddenException("Bạn không có quyền xem thông tin lớp học này");
            return null;
        }

        if (classEntityOpt.isEmpty()) {
            throw new NotFoundException("Không tìm thấy lớp học hoặc bạn không có quyền truy cập. class id: " + id);
        }

        ClassResponse classResponse = classMapper.toClassResponse(classEntityOpt.get());
        return new ApiResponse<>(200, "Lấy thông tin lớp học thành công", classResponse);
    }

    @Override
    public ApiResponse<PageableResponse<ClassResponse>> getClasses(Pageable pageable,
                                                                   String className,
                                                                   Long teacherId,
                                                                   Long courseId,
                                                                   Integer status) {
        UserUtils.UserInfo currentUser = UserUtils.getCurrentUser();
        Long currentUserId = currentUser.userId();
        Set<String> roles = new HashSet<>(currentUser.roles());

        log.info("Current User: {}", currentUser);

        Pageable sortedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by("createdDate").descending()
        );

        Page<ClassEntity> classEntities;

        // ✅ Phân quyền theo role
        if (roles.contains("ROLE_admin") || roles.contains("system-admin")) {
            // Admin xem tất cả
            classEntities = classRepository.findClasses(className, teacherId, courseId, status, sortedPageable);

        } else if (roles.contains("ROLE_teacer")) {
            // Giáo viên chỉ xem lớp của mình - fix status = 1 (active)
            classEntities = classRepository.findClasses(className, currentUserId, courseId, 1, sortedPageable);

        }else if (roles.contains("ROLE_student")) {
            // Học viên xem lớp mà mình đang học
            classEntities = classRepository.findClassesByStudentId(currentUserId, className, courseId, 1, sortedPageable);

        } else {
            // Role không hợp lệ → Không cho xem
            return new ApiResponse<>(403, "Forbidden: Role does not have access", null);
        }

        // Mapping sang DTO
        List<ClassResponse> classResponses = classEntities
                .stream()
                .map(classMapper::toClassResponse)
                .toList();

        PageableResponse<ClassResponse> pageableResponse =
                new PageableResponse<>(classResponses, classEntities.getTotalElements());

        return new ApiResponse<>(200, "OK", pageableResponse);
    }


    @Override
    public ApiResponse<PageableResponse<ClassResponse>> getClassesByTeacherId(Pageable pageable, Long teacherId, Integer status) {
        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by("createdDate").descending());
        Page<ClassEntity> classEntities = classRepository.findAllByTeacherId(teacherId, status, sortedPageable);
        if(classEntities.isEmpty()){
            throw new NotFoundException("No class found");
        }
        List<ClassResponse> classResponses = new ArrayList<>();

        for(ClassEntity c : classEntities){
            classResponses.add(classMapper.toClassResponse(c));
        }
        PageableResponse<ClassResponse> pageableResponse = new PageableResponse<>(classResponses, classEntities.getTotalElements());
        ApiResponse<PageableResponse<ClassResponse>> apiResponse = new ApiResponse<>(200, "OK", pageableResponse);
        return apiResponse;
    }

    @Transactional
    @Override
    public ApiResponse<Long> updateClass(Long id, ClassRequest classRequest) {
        try {
            classValidation.fieldValidation(classRequest, id);

            // Find existing class
            ClassEntity updatedClass = classRepository.findActiveById(id)
                    .orElseThrow(() -> new NotFoundException("Lớp học không tồn tại hoặc đã bị xóa, class id: " + id));

            CopyUtil.copyPropertiesIgnoreNull(classRequest, updatedClass);

            // Update course nếu có
            if (classRequest.getCourseId() != null) {
                CourseEntity courseEntity = courseRepository.findActiveById(classRequest.getCourseId())
                        .orElseThrow(() -> new NotFoundException("Khoá học không tồn tại hoặc đã bị xóa, courseId: " + classRequest.getCourseId()));
                updatedClass.setCourseEntity(courseEntity);
            }

            // Save updated class
            ClassEntity savedClass = classRepository.save(updatedClass);

            return new ApiResponse<>(200, "Update class successfully", savedClass.getId());

        } catch (NotFoundException e) {
            throw e;
        } catch (ValidationException e) {
            return new ApiResponse<>(400, "Validation error: " + e.getMessage(), null);
        } catch (Exception e) {
            log.error("Error updating class with id: " + id, e);
            return new ApiResponse<>(500, "Internal server error: " + e.getMessage(), null);
        }
    }

    @Override
    @Transactional
    public ApiResponse<List<Long>> deleteClass(List<Long> ids) {
        List<ClassEntity> classEntities = classRepository.findAllById(ids);
        if(classEntities.size() == 0) throw new NotFoundException("No class found for deleting");
        for(ClassEntity x : classEntities){
            x.setStatus(-1);
        }
        classRepository.saveAll(classEntities);
        if(ids.size() > 1){
            return new ApiResponse<>(200, "Delete classes successfully", ids);
        }
        return new ApiResponse<>(200, "Delete class successfully", ids);
    }

    @Override
    public ApiResponse<Long> toggleActiveStatus(Long classId) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new NotFoundException("Class not found with ID: " + classId));

        classEntity.setStatus(classEntity.getStatus() == 1 ? 0 : 1);
        classRepository.save(classEntity);
        return new ApiResponse<>(200, "update class status successfully", classEntity.getId());
    }

    @Override
    public ApiResponse<Map<Long, ClassResponse>> getClassesByIds(List<Long> ids) {
        List<ClassEntity> classEntities = classRepository.findAllActiveByIdIn(ids);

        if (classEntities.isEmpty()) {
            throw new NotFoundException("No active classes found for given IDs: " + ids);
        }

        Map<Long, ClassResponse> resultMap = new HashMap<>();
        for (ClassEntity entity : classEntities) {
            resultMap.put(entity.getId(), classMapper.toClassResponse(entity));
        }

        return new ApiResponse<>(200, "Get active classes by IDs successfully", resultMap);
    }
}
