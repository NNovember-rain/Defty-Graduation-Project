package com.defty.class_management_service.service.impl;
import com.defty.class_management_service.client.IdentityServiceClient;
import com.defty.class_management_service.dto.response.ClassOfStudentResponse;
import com.defty.class_management_service.dto.response.StudentInClassResponse;
import com.defty.class_management_service.entity.ClassEntity;
import com.defty.class_management_service.entity.EnrollmentEntity;
import com.defty.class_management_service.repository.IClassRepository;
import com.defty.class_management_service.repository.IEnrollmentRepository;
import com.defty.class_management_service.service.IEnrollmentService;
import com.example.common_library.dto.response.PageableResponse;
import com.example.common_library.dto.response.UserResponse;
import com.example.common_library.exceptions.NotFoundException;
import com.example.common_library.response.ApiResponse;
import com.example.common_library.utils.UserUtils;
import feign.FeignException;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.ForbiddenException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.service.spi.ServiceException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class EnrollmentService implements IEnrollmentService {

    IEnrollmentRepository enrollmentRepository;
    IClassRepository classRepository;
    IdentityServiceClient identityServiceClient;

    @Override
    @Transactional
    public ApiResponse<Object> enrollStudent(Long classId, Long studentId) {
        try {
            // check for class existence
            ClassEntity classEntity = classRepository.findById(classId)
                    .orElseThrow(() -> new NotFoundException("Class not found with ID: " + classId));

            // check for student existence -> call user-service

            // Check if students have attended class
            boolean alreadyEnrolled = enrollmentRepository.existsByClassIdAndStudentId(classId, studentId);
            if (alreadyEnrolled) {
                return new ApiResponse<>(200, "Student is already in this class, studentId: " + studentId, classId);
            }

            EnrollmentEntity enrollmentEntity = new EnrollmentEntity();
            enrollmentEntity.setStudentId(studentId);
            enrollmentEntity.setClassId(classId);
            enrollmentRepository.save(enrollmentEntity);

            log.info("Student {} successfully enrolled in class {}", studentId, classId);
            return new ApiResponse<>(201, "Create enrollment successfully.", classEntity.getId());

        } catch (Exception e) {
            log.error("Unexpected error enrolling student {} in class {}: {}", studentId, classId, e.getMessage());
            return new ApiResponse<>(HttpStatus.INTERNAL_SERVER_ERROR.value(), "An error occurred while registering for the class. " + studentId, classId);
        }
    }

    @Override
    @Transactional
    public ApiResponse<Object> removeStudentFromClass(Long classId, List<Long> studentIds) {
        try {
            List<EnrollmentEntity> enrollmentEntities = new ArrayList<>();

            for (Long s : studentIds) {
                enrollmentRepository.findByClassIdAndStudentId(classId, s)
                        .ifPresent(enrollmentEntities::add);
            }

            if (enrollmentEntities.isEmpty()) {
                throw new NotFoundException("No enrollments found for deleting");
            }

            for (EnrollmentEntity e : enrollmentEntities) {
                e.setStatus(-1);
            }

            enrollmentRepository.saveAll(enrollmentEntities);

            log.info("Student {} successfully removed from class {}", studentIds, classId);

            return new ApiResponse<>(
                    200,
                    studentIds.size() > 1 ? "Delete students successfully" : "Delete student successfully",
                    studentIds
            );
        } catch (Exception e) {
            log.error("Unexpected error removing student {} from class {}: {}", studentIds, classId, e.getMessage());
            return new ApiResponse<>(
                    HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "An error occurred while deleting students from class. " + studentIds,
                    classId
            );
        }
    }

    @Override
    public ApiResponse<PageableResponse<ClassOfStudentResponse>> getClassesByStudentId(Pageable pageable, Long studentId) {
        return null;
    }
    @Override
    public ApiResponse<PageableResponse<StudentInClassResponse>> getStudentsInClass(Pageable pageable, Long classId) {
        try {
            // 1. Validate class exists
            ClassEntity classEntity = classRepository.findById(classId)
                    .orElseThrow(() -> new NotFoundException("Class not found with id: " + classId));

            // ✅ Lấy thông tin user hiện tại (thay cho authUserContext)
            UserUtils.UserInfo currentUser = UserUtils.getCurrentUser();
            Long currentUserId = currentUser.userId();
            log.info("currentUser: {}", currentUser);

            // ✅ Tách role và permission (role = bắt đầu ROLE_)
            Set<String> roles = new HashSet<>();
            Set<String> permissions = new HashSet<>();

            for (String r : currentUser.roles()) {
                if (r.startsWith("ROLE_")) {
                    roles.add(r);
                } else {
                    permissions.add(r);
                }
            }

            // 2. Authorization check
            if (roles.contains("ROLE_admin")) {
                // Admin có toàn quyền
            } else if (roles.contains("ROLE_teacher")) {
                // Teacher/TA chỉ được xem lớp mình quản lý
                boolean isOwner = classEntity.getTeacherId().equals(currentUserId);
                if (!isOwner) {
                    throw new ForbiddenException("You are not allowed to view students in this class");
                }
            } else if (roles.contains("ROLE_student")) {
                // Student: chỉ xem được lớp mình đã tham gia
                Optional<EnrollmentEntity> enrollmentOpt =
                        enrollmentRepository.findByClassIdAndStudentId(classId, currentUserId);
                if (enrollmentOpt.isEmpty() || enrollmentOpt.get().getStatus() != 1) {
                    throw new ForbiddenException("You are not allowed to view this class");
                }
            } else {
                throw new ForbiddenException("You don't have permission to view students in this class");
            }

            // 3. Get enrollments
            Page<EnrollmentEntity> enrollmentPage = enrollmentRepository.findAllByClassId(classId, pageable);

            // Student: chỉ hiện student active
            if (roles.contains("ROLE_student")) {
                enrollmentPage = new PageImpl<>(
                        enrollmentPage.getContent().stream()
                                .filter(e -> e.getStatus() == 1)
                                .toList(),
                        pageable,
                        enrollmentPage.getTotalElements()
                );
            }

            if (enrollmentPage.isEmpty()) {
                PageableResponse<StudentInClassResponse> emptyResponse =
                        new PageableResponse<>(List.of(), 0L);
                return new ApiResponse<>(200, "No students found in this class.", emptyResponse);
            }

            // 4. Extract student IDs
            List<Long> studentIds = enrollmentPage.getContent().stream()
                    .map(EnrollmentEntity::getStudentId)
                    .toList();

            // 5. Call identity service
            ApiResponse<List<UserResponse>> userResponse = identityServiceClient.getListUser(studentIds);
            if (userResponse == null || userResponse.getResult() == null) {
                throw new ServiceException("Failed to get user information from identity service");
            }

            List<UserResponse> users = userResponse.getResult();

            // 6. Create map
            Map<Long, UserResponse> userMap = users.stream()
                    .collect(Collectors.toMap(UserResponse::getId, Function.identity()));

            // 7. Combine data
            List<StudentInClassResponse> studentResponses = enrollmentPage.getContent().stream()
                    .map(enrollment -> {
                        UserResponse user = userMap.get(enrollment.getStudentId());
                        if (user != null) {
                            LocalDate createdDate = Optional.ofNullable(enrollment.getCreatedDate())
                                    .map(LocalDateTime::toLocalDate)
                                    .orElse(null);
                            return new StudentInClassResponse(
                                    enrollment.getStudentId(),
                                    user.getUsername(),
                                    user.getFullName(),
                                    user.getEmail(),
                                    user.getDob(),
                                    null,
                                    user.getUserCode(),
                                    user.getIsActive(),
                                    enrollment.getStatus(),
                                    createdDate
                            );
                        }
                        return null;
                    })
                    .filter(Objects::nonNull)
                    .toList();


            // 8. Pageable response
            PageableResponse<StudentInClassResponse> pageableResponse = new PageableResponse<>(
                    studentResponses,
                    enrollmentPage.getTotalElements()
            );

            return new ApiResponse<>(200, "Students in class retrieved successfully.", pageableResponse);

        } catch (FeignException e) {
            log.error("Error calling identity service: {}", e.getMessage());
            throw new ServiceException("Failed to get user information: " + e.getMessage());
        } catch (ForbiddenException e) {
            log.warn("Permission denied: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error getting students in class: {}", e.getMessage(), e);
            throw new ServiceException("Failed to get students in class: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ApiResponse<Object> updateEnrollmentStatus(Long classId, Long studentId, Integer status) {
        try {
            // ✅ Lấy user hiện tại
            UserUtils.UserInfo currentUser = UserUtils.getCurrentUser();
            Long currentUserId = currentUser.userId();
            log.info("currentUser: {}", currentUser);

            // Tách role (bắt đầu bằng ROLE_) và permission (nếu cần sau này)
            Set<String> roles = new HashSet<>();
            for (String r : currentUser.roles()) {
                if (r.startsWith("ROLE_")) {
                    roles.add(r);
                }
            }

            // 1. Validate class exists
            ClassEntity classEntity = classRepository.findActiveById(classId)
                    .orElseThrow(() -> new NotFoundException("Class not found with ID: " + classId));

            // 2. Check permission / role
            if (roles.contains("ROLE_admin")) {
                // admin => full quyền
            } else if (roles.contains("ROLE_teacher")) {
                if (!Objects.equals(classEntity.getTeacherId(), currentUserId)) {
                    throw new ForbiddenException("Bạn không có quyền thay đổi trạng thái sinh viên trong lớp này");
                }
            } else {
                throw new ForbiddenException("Bạn không có quyền thay đổi trạng thái sinh viên");
            }

            // 3. Find enrollment
            EnrollmentEntity enrollment = enrollmentRepository.findByClassIdAndStudentId(classId, studentId)
                    .orElseThrow(() -> new NotFoundException(
                            "Student not found in this class. StudentId: " + studentId + ", ClassId: " + classId));

            // 4. Validate status value
            if (!isValidStatus(status)) {
                return new ApiResponse<>(
                        HttpStatus.BAD_REQUEST.value(),
                        "Invalid status. Valid statuses: -1 (left), 0 (pending), 1 (approved), 2 (rejected)",
                        null
                );
            }

            // 5. Check current status
            Integer currentStatus = enrollment.getStatus();

            // 6. Update status
            enrollment.setStatus(status);
            enrollmentRepository.save(enrollment);

            // 7. Create response message
            String actionMessage = getActionMessage(status);

            log.info("Updated enrollment status for student {} in class {} from {} to {} by user {}",
                    studentId, classId, currentStatus, status, currentUserId);

            return new ApiResponse<>(
                    200,
                    actionMessage + " StudentId: " + studentId,
                    Map.of(
                            "studentId", studentId,
                            "classId", classId,
                            "previousStatus", currentStatus,
                            "newStatus", status,
                            "statusMessage", getStatusMessage(status)
                    )
            );

        } catch (NotFoundException e) {
            log.error("Error updating enrollment status: {}", e.getMessage());
            return new ApiResponse<>(
                    HttpStatus.NOT_FOUND.value(),
                    e.getMessage(),
                    null
            );
        } catch (ForbiddenException e) {
            log.error("Permission denied: {}", e.getMessage());
            return new ApiResponse<>(
                    HttpStatus.FORBIDDEN.value(),
                    e.getMessage(),
                    null
            );
        } catch (Exception e) {
            log.error("Unexpected error updating enrollment status for student {} in class {}: {}",
                    studentId, classId, e.getMessage());
            return new ApiResponse<>(
                    HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "An error occurred while updating enrollment status. StudentId: " + studentId,
                    null
            );
        }
    }

    @Override
    @Transactional
    public ApiResponse<Object> joinClassByInvite(String inviteCode, Long studentId) {
        // Nếu không tìm thấy class -> throw NotFoundException
        ClassEntity classEntity = classRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new NotFoundException("Mã mời không hợp lệ hoặc đã hết hạn"));

        // TODO: Kiểm tra student có tồn tại không (nếu cần)

        // Kiểm tra enrollment hiện tại
        Optional<EnrollmentEntity> existingEnrollmentOpt =
                enrollmentRepository.findByClassIdAndStudentId(classEntity.getId(), studentId);

        if (existingEnrollmentOpt.isPresent()) {
            EnrollmentEntity existingEnrollment = existingEnrollmentOpt.get();
            int status = existingEnrollment.getStatus();

            switch (status) {
                case 1: // Active
                    return new ApiResponse<>(200,
                            "Student is already active in this class",
                            classEntity.getId());

                case 0: // Pending
                    return new ApiResponse<>(200,
                            "Student already requested to join, pending approval",
                            classEntity.getId());

                case 2: // Rejected
                    return new ApiResponse<>(200,
                            "Join request was rejected before, please contact teacher",
                            classEntity.getId());

                case -1: // Deleted => cho phép gửi lại yêu cầu
                    existingEnrollment.setStatus(0); // pending
                    enrollmentRepository.save(existingEnrollment);

                    log.info("Student {} re-requested to join class {} (previously deleted)",
                            studentId, classEntity.getId());

                    return new ApiResponse<>(201,
                            "Class request re-sent, pending approval. StudentId: " + studentId,
                            classEntity.getId());

                default:
                    return new ApiResponse<>(400,
                            "Invalid enrollment status",
                            null);
            }
        }

        // Nếu chưa có enrollment nào -> tạo mới với status = 0 (pending)
        EnrollmentEntity enrollmentEntity = new EnrollmentEntity();
        enrollmentEntity.setStudentId(studentId);
        enrollmentEntity.setClassId(classEntity.getId());
        enrollmentEntity.setStatus(0); // pending

        enrollmentRepository.save(enrollmentEntity);

        log.info("Student {} requested to join class {} via invite code",
                studentId, classEntity.getId());

        return new ApiResponse<>(201,
                "Class request sent, pending approval. StudentId: " + studentId,
                classEntity.getId());
    }

    @Override
    @Transactional
    public ApiResponse<Object> leaveClass(Long classId, Long studentId) {
        try {
            EnrollmentEntity enrollment = enrollmentRepository.findByClassIdAndStudentId(classId, studentId)
                    .orElseThrow(() -> new NotFoundException("You have not attended this class yet."));
            enrollment.setStatus(-1);
            enrollmentRepository.save(enrollment);

            log.info("Student {} left class {}", studentId, classId);
            return new ApiResponse<>(200, "Leaving the classroom successfully, studentId: " + studentId, classId);
        }catch (Exception e) {
            log.error("Unexpected error leaving class {} for student {}: {}", classId, studentId, e.getMessage());
            return new ApiResponse<>(HttpStatus.INTERNAL_SERVER_ERROR.value(), "An error occurred while leaving the classroom. " + studentId, classId);
        }
    }

    @Override
    public ApiResponse<List<Long>> getStudentsInClass(Long classId) {
        List<EnrollmentEntity> enrollmentEntity = enrollmentRepository.findByClassIdAndStatus(classId,1);
        if(!enrollmentEntity.isEmpty()){
            List<Long> studentIds = enrollmentEntity.stream()
                    .map(EnrollmentEntity::getStudentId)
                    .toList();
            return new ApiResponse<>(200, "Get students in class successfully", studentIds);
        } else {
            return new ApiResponse<>(200, "No students found in this class.", Collections.emptyList());
        }
    }

    private boolean isValidStatus(Integer status) {
        return status != null && (status == -1 || status == 0 || status == 1 || status == 2);
    }
    private String getStatusMessage(Integer status) {
        return switch (status) {
            case -1 -> "Đã rời khỏi lớp";
            case 0 -> "Chờ duyệt";
            case 1 -> "Đã duyệt";
            case 2 -> "Đã từ chối";
            default -> "Không xác định";
        };
    }
    private String getActionMessage(Integer status) {
        return switch (status) {
            case -1 -> "Student removed from class successfully.";
            case 0 -> "Student status set to pending successfully.";
            case 1 -> "Student approved successfully.";
            case 2 -> "Student rejected successfully.";
            default -> "Student status updated successfully.";
        };
    }
}
