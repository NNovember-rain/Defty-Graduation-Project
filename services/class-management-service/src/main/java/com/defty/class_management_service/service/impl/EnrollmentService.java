package com.defty.class_management_service.service.impl;

import com.defty.class_management_service.client.IdentityServiceClient;
import com.defty.class_management_service.dto.response.ClassResponse;
import com.defty.class_management_service.dto.response.EnrollmentResponse;
import com.defty.class_management_service.dto.response.StudentInClassResponse;
import com.defty.class_management_service.entity.ClassEnrollmentEntity;
import com.defty.class_management_service.mapper.ClassMapper;
import com.defty.class_management_service.repository.IClassRepository;
import com.defty.class_management_service.repository.IEnrollmentRepository;
import com.defty.class_management_service.service.IEnrollmentService;
import com.example.common_library.dto.response.PageableResponse;
import com.example.common_library.dto.response.UserResponse;
import com.example.common_library.exceptions.NotFoundException;
import com.example.common_library.response.ApiResponse;
import com.example.common_library.response.ServiceResponse;
import com.example.common_library.service.ExternalServiceClient;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.service.spi.ServiceException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.ZoneId;
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

    @Override
    public ApiResponse<PageableResponse<ClassResponse>> getClassesByStudentId(Pageable pageable, Long studentId) {
        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by("createdDate").descending());
        Page<ClassEnrollmentEntity> classEnrollmentEntities = enrollmentRepository.findAllByStudentId(studentId, sortedPageable);
        if(classEnrollmentEntities.isEmpty()){
            return new ApiResponse<>(404, "Class doesn't exist", null);
        }
        List<ClassResponse> classResponses = new ArrayList<>();
        for(ClassEnrollmentEntity c : classEnrollmentEntities){
            classResponses.add(classMapper.toClassResponse(c.getClassroom()));
        }
        PageableResponse<ClassResponse> pageableResponse = new PageableResponse<>(classResponses, classEnrollmentEntities.getTotalElements());
        ApiResponse<PageableResponse<ClassResponse>> apiResponse = new ApiResponse<>(200, "OK", pageableResponse);
        return apiResponse;
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
}
