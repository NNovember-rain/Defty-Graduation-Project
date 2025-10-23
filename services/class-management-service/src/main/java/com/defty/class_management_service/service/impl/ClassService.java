package com.defty.class_management_service.service.impl;

import com.defty.class_management_service.dto.request.ClassRequest;
import com.defty.class_management_service.dto.response.ClassResponse;
import com.defty.class_management_service.entity.ClassEntity;
import com.defty.class_management_service.mapper.ClassMapper;
import com.defty.class_management_service.repository.IClassRepository;
import com.defty.class_management_service.service.IClassService;
import com.defty.class_management_service.validation.ClassValidation;
import com.example.common_library.dto.response.PageableResponse;
import com.example.common_library.exceptions.NotFoundException;
import com.example.common_library.response.ApiResponse;
import com.example.common_library.utils.CopyUtil;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ClassService implements IClassService {
    ClassValidation classValidation;
    ClassMapper classMapper;
    IClassRepository classRepository;
//    ClassEnrollmentRepository enrollmentRepository;

    @Override
    @Transactional
    public ApiResponse<Long> createClass(ClassRequest classRequest) {

        classValidation.fieldValidation(classRequest);

        ClassEntity classEntity = classMapper.toClassEntity(classRequest);

        try {
            classRepository.save(classEntity);
        } catch (Exception e) {
            log.error("Error saving classEntity: {}", e.getMessage(), e);
            throw e;
        }

        return new ApiResponse<>(201, "Created", classEntity.getId());

    }
    @Override
    public ApiResponse getClassById(Long id) {
        Optional<ClassEntity> classEntity = classRepository.findActiveById(id);
        if(!classEntity.isPresent()){
            throw new NotFoundException("Class doesn't exist, " + "class id: " + id);
        }
        ClassResponse classResponse = classMapper.toClassResponse(classEntity.get());
        return new ApiResponse<>(200, "get class successfully", classResponse);
    }

    @Override
    public ApiResponse<PageableResponse<ClassResponse>> getClasses(Pageable pageable, String className, Long teacherId, Integer status) {
        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by("createdDate").descending());

        Page<ClassEntity> classEntities = classRepository.findClasses(
                className, teacherId, status, sortedPageable
        );
//        if(classEntities.isEmpty()){
//            return new ApiResponse<>(404, "Class doesn't exist", null);
//        }
        List<ClassResponse> classResponses = new ArrayList<>();

        for(ClassEntity c : classEntities){
            classResponses.add(classMapper.toClassResponse(c));
        }
        PageableResponse<ClassResponse> pageableResponse = new PageableResponse<>(classResponses, classEntities.getTotalElements());
        ApiResponse<PageableResponse<ClassResponse>> apiResponse = new ApiResponse<>(200, "OK", pageableResponse);
        return apiResponse;
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

    @Override
    @Transactional
    public ApiResponse<Long> updateClass(Long id, ClassRequest classRequest) {
        classValidation.fieldValidation(classRequest);
        Optional<ClassEntity> classEntity = classRepository.findById(id);

        if(classEntity.isPresent()){
            ClassEntity updatedClass = classEntity.get();
            CopyUtil.copyPropertiesIgnoreNull(classRequest, updatedClass);
            try{
                classRepository.save(updatedClass);
            }
            catch (Exception e){
                return new ApiResponse<>(500, e.getMessage(), id);
            }
        }
        else{
            throw new NotFoundException("Class doesn't exist" + ", class id: " + id);
        }
        return new ApiResponse<>(200, "update class successfully", id);
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



//    @Transactional
//    public ApiResponse<List<EnrollmentDto>> addStudentsToClass(Long classId, List<Long> studentIds) {
//        Class classroom = classRepository.findById(classId)
//                .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + classId));
//
//        List<EnrollmentDto> createdEnrollments = new java.util.ArrayList<>();
//        List<Long> failedStudentIds = new java.util.ArrayList<>();
//
//        for (Long studentId : studentIds) {
//            boolean alreadyEnrolled = enrollmentRepository.findByClassroomIdAndStudentId(classroom.getId(), studentId).isPresent();
//            if (alreadyEnrolled) {
//                log.warn("Student ID {} is already enrolled in class {}. Skipping enrollment.", studentId, classId);
//                failedStudentIds.add(studentId);
//                continue;
//            }
//
//            ClassEnrollment enrollment = new ClassEnrollment();
//            enrollment.setClassroom(classroom);
//            enrollment.setStudentId(studentId);
//            enrollment.setStatus("ACTIVE");
//
//            try {
//                ClassEnrollment savedEnrollment = enrollmentRepository.save(enrollment);
//                createdEnrollments.add(classMapper.toEnrollmentDto(savedEnrollment));
//            } catch (DataIntegrityViolationException e) {
//                log.error("Failed to enroll student {} in class {} due to DB constraint: {}", studentId, classId, e.getMessage());
//                failedStudentIds.add(studentId);
//            } catch (Exception e) {
//                log.error("An unexpected error occurred while enrolling student {} in class {}: {}", studentId, classId, e.getMessage(), e);
//                failedStudentIds.add(studentId);
//            }
//        }
//
//        String message = "Students enrolled successfully.";
//        if (!failedStudentIds.isEmpty()) {
//            message += " Some students could not be enrolled: " + failedStudentIds;
//            return ApiResponse.error(message, "PARTIAL_ENROLLMENT_ERROR");
//        }
//        return ApiResponse.success(createdEnrollments, message);
//    }
//
//    @Override
//    public EnrollmentDto enrollStudentInClass(String inviteCode, Long studentId) {
//        throw new UnsupportedOperationException("This method is deprecated for current business logic. Use addStudentsToClass instead.");
//    }
//
//    @Override
//    public List<EnrollmentDto> getStudentsInClass(Long classId) {
//        classRepository.findById(classId)
//                .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + classId));
//
//        List<ClassEnrollment> enrollments = enrollmentRepository.findByClassroomId(classId);
//        return enrollments.stream()
//                .map(classMapper::toEnrollmentDto)
//                .collect(Collectors.toList());
//    }
//
//    @Override
//    public List<ClassResponse> getClassesByStudentId(Long studentId) {
//        List<ClassEnrollment> enrollments = enrollmentRepository.findByStudentId(studentId);
//        List<Class> classes = enrollments.stream()
//                .map(ClassEnrollment::getClassroom)
//                .collect(Collectors.toList());
//        return classes.stream()
//                .map(classMapper::toClassResponse)
//                .collect(Collectors.toList());
//    }
//
//    @Override
//    @Transactional
//    public void leaveClass(Long classId, Long studentId) {
//        ClassEnrollment enrollment = enrollmentRepository.findByClassroomIdAndStudentId(classId, studentId)
//                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found for student " + studentId + " in class " + classId));
//        enrollmentRepository.delete(enrollment);
//    }

}
