package com.defty.class_management_service.service.impl;

import com.defty.class_management_service.client.IdentityServiceClient;
import com.defty.class_management_service.dto.response.ClassOfStudentResponse;
import com.defty.class_management_service.dto.response.ClassResponse;
import com.defty.class_management_service.dto.response.StudentImportRequest;
import com.defty.class_management_service.dto.response.StudentInClassResponse;
import com.defty.class_management_service.entity.ClassEnrollmentEntity;
import com.defty.class_management_service.entity.ClassEntity;
import com.defty.class_management_service.mapper.ClassMapper;
import com.defty.class_management_service.repository.IClassRepository;
import com.defty.class_management_service.repository.IEnrollmentRepository;
import com.defty.class_management_service.service.IEnrollmentService;
import com.example.common_library.dto.response.PageableResponse;
import com.example.common_library.dto.response.UserResponse;
import com.example.common_library.exceptions.NotFoundException;
import com.example.common_library.response.ApiResponse;
import com.example.common_library.service.ExternalServiceClient;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.service.spi.ServiceException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class EnrollmentService implements IEnrollmentService {
    IClassRepository classRepository;
    IEnrollmentRepository enrollmentRepository;
    ClassMapper classMapper;
    RestTemplate restTemplate;
    ExternalServiceClient externalServiceClient;
    IdentityServiceClient identityServiceClient;

//    @Override
//    public ApiResponse<PageableResponse<ClassResponse>> getClassesByStudentId(Pageable pageable, Long studentId) {
//        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by("createdDate").descending());
//        Page<ClassEnrollmentEntity> classEnrollmentEntities = enrollmentRepository.findAllByStudentId(studentId, sortedPageable);
//        if(classEnrollmentEntities.isEmpty()){
//            return new ApiResponse<>(404, "Class doesn't exist", null);
//        }
//        List<ClassResponse> classResponses = new ArrayList<>();
//        for(ClassEnrollmentEntity c : classEnrollmentEntities){
//            classResponses.add(classMapper.toClassResponse(c.getClassroom()));
//        }
//        PageableResponse<ClassResponse> pageableResponse = new PageableResponse<>(classResponses, classEnrollmentEntities.getTotalElements());
//        ApiResponse<PageableResponse<ClassResponse>> apiResponse = new ApiResponse<>(200, "OK", pageableResponse);
//        return apiResponse;
//    }

    @Override
    public ApiResponse<PageableResponse<ClassOfStudentResponse>> getClassesByStudentId(Pageable pageable, Long studentId) {
        try {
            // 1. Validate student exists (gọi sang identity service)
            ApiResponse<UserResponse> studentResponse = identityServiceClient.getUser(studentId);
            if (studentResponse == null || studentResponse.getResult() == null) {
                throw new NotFoundException("Student not found with id: " + studentId);
            }

            // 2. Get enrollments (tất cả lớp mà student này tham gia)
            Page<ClassEnrollmentEntity> enrollmentPage = enrollmentRepository.findAllByStudentId(studentId, pageable);

            // Nếu student chưa tham gia lớp nào -> trả về list rỗng
            if (enrollmentPage.isEmpty()) {
                PageableResponse<ClassOfStudentResponse> emptyResponse =
                        new PageableResponse<>(List.of(), 0L);
                return new ApiResponse<>(200, "No classes found for this student.", emptyResponse);
            }

            // 3. Extract class IDs
            List<Long> classIds = enrollmentPage.getContent().stream()
                    .map(e -> e.getClassroom().getId())
                    .filter(Objects::nonNull)
                    .toList();

            // 4. Get classes info
            List<ClassEntity> classes = classRepository.findAllById(classIds);

            // 5. Extract teacherIds
            List<Long> teacherIds = classes.stream()
                    .map(ClassEntity::getTeacherId)
                    .filter(Objects::nonNull)
                    .distinct() // tránh duplicate gây lỗi Collectors.toMap
                    .toList();

            // 6. Call identity service to get teachers info
            ApiResponse<List<UserResponse>> teacherResponse = identityServiceClient.getListUser(teacherIds);
            if (teacherResponse == null || teacherResponse.getResult() == null) {
                throw new ServiceException("Failed to get teacher information from identity service");
            }
            Map<Long, UserResponse> teacherMap = teacherResponse.getResult().stream()
                    .collect(Collectors.toMap(UserResponse::getId, Function.identity()));

            // 7. Combine enrollment + class info + teacher info
            List<ClassOfStudentResponse> classResponses = classes.stream()
                    .map(c -> {
                        UserResponse teacher = teacherMap.get(c.getTeacherId());
                        return new ClassOfStudentResponse(
                                c.getId(),
                                c.getName(),
                                c.getInviteCode(),
                                teacher != null ? teacher.getFullName() : null,
                                null // TODO: có thể map thêm assignment nếu cần
                        );
                    })
                    .toList();

            // 8. Pageable response
            PageableResponse<ClassOfStudentResponse> pageableResponse =
                    new PageableResponse<>(classResponses, enrollmentPage.getTotalElements());

            return new ApiResponse<>(200, "Classes retrieved successfully.", pageableResponse);

        } catch (FeignException e) {
            log.error("Error calling identity service", e);
            throw new ServiceException("Failed to get teacher information: " + e.getMessage(), e);
        } catch (NotFoundException e) {
            // Giữ nguyên NotFoundException để global handler trả về 404
            log.warn("Not found: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error getting classes by student", e);
            throw new ServiceException("Failed to get classes by student: " + e.getMessage(), e);
        }
    }



    @Override
    public ApiResponse<Object> getStudentsInClass(Pageable pageable, Long classId) {
        try {
            // 1. Validate class exists
            classRepository.findById(classId)
                    .orElseThrow(() -> new NotFoundException("Class not found with id: " + classId));

            // 2. Get enrollments
            Page<ClassEnrollmentEntity> enrollmentPage = enrollmentRepository.findAllActiveByClassroom(classId, pageable);

            if (enrollmentPage.isEmpty()) {
                PageableResponse<StudentInClassResponse> emptyResponse =
                        new PageableResponse<>(List.of(), 0L);
                return new ApiResponse<>(200, "No students found in this class.", emptyResponse);
            }

            // 3. Extract student IDs
            List<Long> studentIds = enrollmentPage.getContent().stream()
                    .map(ClassEnrollmentEntity::getStudentId)
                    .toList();

            // 4. Call identity service to get user information
            ApiResponse<List<UserResponse>> userResponse = identityServiceClient.getListUser(studentIds);

            if (userResponse == null || userResponse.getResult() == null) {
                throw new ServiceException("Failed to get user information from identity service");
            }

            List<UserResponse> users = userResponse.getResult();

            // 5. Create map for quick lookup
            Map<Long, UserResponse> userMap = users.stream()
                    .collect(Collectors.toMap(UserResponse::getId, Function.identity()));

            // 6. Combine enrollment and user data
            List<StudentInClassResponse> studentResponses = enrollmentPage.getContent().stream()
                    .map(enrollment -> {
                        UserResponse user = userMap.get(enrollment.getStudentId());
                        if (user != null) {
                            return new StudentInClassResponse(
                                    enrollment.getStudentId(),
                                    user.getUsername(),
                                    user.getFullName(),
                                    user.getEmail(),
//                                    user.getDob(),
                                    user.getUserCode(),
//                                    user.getCreatedDate(),
                                    user.getIsActive(),
                                    enrollment.getEnrollmentDate(),
                                    enrollment.getStatus()
//                                    user.getRoles()
                            );
                        }
                        return null; // or create a default response
                    })
                    .filter(Objects::nonNull)
                    .toList();

            // 7. Create pageable response (sử dụng constructor hiện có của PageableResponse)
            PageableResponse<StudentInClassResponse> pageableResponse = new PageableResponse<>(
                    studentResponses,
                    enrollmentPage.getTotalElements()
            );

            return new ApiResponse<>(200, "Students in class retrieved successfully.", pageableResponse);

        } catch (FeignException e) {
            log.error("Error calling identity service: {}", e.getMessage());
            throw new ServiceException("Failed to get user information: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error getting students in class: {}", e.getMessage());
            throw new ServiceException("Failed to get students in class: " + e.getMessage());
        }
    }

    @Override
    public void importStudentsToClass(Long classId, List<StudentImportRequest> students) throws Exception {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new Exception("Class not found with id: " + classId));

        List<String> codeUsers = students.stream()
                .map(StudentImportRequest::getUserCode)
                .toList();

        ApiResponse<List<UserResponse>> userResponse = identityServiceClient.getListUserWithCodeUsers(codeUsers);
        if (userResponse == null || userResponse.getResult() == null || userResponse.getResult().isEmpty()) {
            throw new ServiceException("Failed to get user information from identity service");
        }

        Map<String, Long> userCodeToId = userResponse.getResult().stream()
                .collect(Collectors.toMap(UserResponse::getUserCode, UserResponse::getId));

        for (StudentImportRequest student : students) {
            if (!userCodeToId.containsKey(student.getUserCode())) {
                continue;
            }

            Long userId = userCodeToId.get(student.getUserCode());
            boolean exists = enrollmentRepository.existsByClassroomAndStudentId(classEntity, userId);
            if (exists) continue;

            ClassEnrollmentEntity enrollment = new ClassEnrollmentEntity();
            enrollment.setStudentId(userId);
            enrollment.setClassroom(classEntity);
            enrollment.setEnrollmentDate(new Date());
            enrollmentRepository.save(enrollment);
        }
    }

}
