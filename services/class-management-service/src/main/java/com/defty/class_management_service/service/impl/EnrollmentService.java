package com.defty.class_management_service.service.impl;

import com.defty.class_management_service.dto.response.ClassResponse;
import com.defty.class_management_service.entity.ClassEnrollmentEntity;
import com.defty.class_management_service.mapper.ClassMapper;
import com.defty.class_management_service.repository.IClassRepository;
import com.defty.class_management_service.repository.IEnrollmentRepository;
import com.defty.class_management_service.service.IEnrollmentService;
import com.example.common_library.dto.response.PageableResponse;
import com.example.common_library.response.ApiResponse;
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

//    @Override
//    public ApiResponse<PageableResponse<EnrollmentDto>> getStudentsInClass(Pageable pageable, Long classId) {
//        return null;
//    }
//    @Override
//    public ApiResponse<PageableResponse<StudentInClassDto>> getStudentsInClass(Pageable pageable, Long classId) {
//        classRepository.findById(classId)
//                .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + classId));
//
//        Page<ClassEnrollment> enrollmentPage = enrollmentRepository.findByClassroomId(classId, pageable);
//
//        // Bỏ qua nếu không có sinh viên nào
//        if (enrollmentPage.isEmpty()) {
//            // Trả về một Page rỗng với thông tin Pageable để frontend xử lý
//            return ApiResponse.success(new PageableResponse<>(List.of(), 0L), "No students found in this class.");
//        }
//
//        // 1. Lấy danh sách studentIds từ enrollmentPage
//        List<Long> studentIds = enrollmentPage.getContent().stream()
//                .map(ClassEnrollment::getStudentId)
//                .collect(Collectors.toList());
//
//        // 2. GỌI USER-SERVICE ĐỂ LẤY THÔNG TIN CHI TIẾT TẤT CẢ SINH VIÊN
//        // API mới này sẽ nhận danh sách IDs và trả về danh sách Users
//        // Ví dụ: GET http://user-service/api/v1/users/in?ids=1,2,3
//        String userApiUrl = "http://user-service/api/v1/users/in?ids=" + studentIds.stream().map(String::valueOf).collect(Collectors.joining(","));
//        UserDto[] users = restTemplate.getForObject(userApiUrl, UserDto[].class);
//        Map<Long, UserDto> userMap = Arrays.stream(users).collect(Collectors.toMap(UserDto::getId, user -> user));
//
//        // 3. Kết hợp dữ liệu và ánh xạ sang DTO
//        List<StudentInClassDto> studentDtos = enrollmentPage.getContent().stream()
//                .map(enrollment -> {
//                    UserDto user = userMap.get(enrollment.getStudentId());
//                    if (user == null) {
//                        // Xử lý trường hợp không tìm thấy user
//                        return new StudentInClassDto(enrollment.getId(), enrollment.getStudentId(), "Unknown User", "N/A", "N/A", enrollment.getEnrollmentDate());
//                    }
//                    return new StudentInClassDto(enrollment.getId(), user.getId(), user.getFullName(), user.getEmail(), user.getUserCode(), enrollment.getEnrollmentDate());
//                })
//                .collect(Collectors.toList());
//
//        PageableResponse<StudentInClassDto> pageableResponse = new PageableResponse<>(studentDtos, enrollmentPage.getTotalElements());
//
//        return ApiResponse.success(pageableResponse, "Students in class retrieved successfully.");
//    }
}
