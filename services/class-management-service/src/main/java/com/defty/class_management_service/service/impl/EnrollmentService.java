package com.defty.class_management_service.service.impl;

import com.defty.class_management_service.dto.response.ClassResponse;
import com.defty.class_management_service.entity.ClassEnrollmentEntity;
import com.defty.class_management_service.entity.ClassEntity;
import com.defty.class_management_service.mapper.ClassMapper;
import com.defty.class_management_service.repository.IClassRepository;
import com.defty.class_management_service.repository.IEnrollmentRepository;
import com.defty.class_management_service.service.IEnrollmentService;
import com.example.common_library.dto.response.ApiResponse;
import com.example.common_library.dto.response.PageableResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class EnrollmentService implements IEnrollmentService {
    IClassRepository classRepository;
    IEnrollmentRepository enrollmentRepository;
    ClassMapper classMapper;
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
}
