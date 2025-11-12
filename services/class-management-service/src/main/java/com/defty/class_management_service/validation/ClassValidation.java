package com.defty.class_management_service.validation;

import com.defty.class_management_service.dto.request.ClassRequest;
import com.defty.class_management_service.repository.IClassRepository;
import com.example.common_library.exceptions.FieldRequiredException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
@Component
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ClassValidation {

    IClassRepository classRepository;

    public void fieldValidation(ClassRequest classRequest) {
        StringBuilder errorMessage = new StringBuilder();

        // Validate teacherId
        if (classRequest.getTeacherId() == null) {
            appendMessage(errorMessage, "ID giáo viên không được để trống!");
        }
        else {

        }

        String className = classRequest.getClassName();

        // Validate className null or empty
        if (isNullOrEmpty(className)) {
            appendMessage(errorMessage, "Tên lớp không được để trống!");
        } else {
            // Validate className length
            if (className.length() < 3 || className.length() > 20) {
                throw new FieldRequiredException("Tên lớp phải trong phạm vi từ 3 đến 20 ký tự!");
            }

            // Validate duplicate className
            boolean exists = classRepository.existsByClassNameAndStatusNot(className.trim(), -1);
            if (exists) {
                throw new FieldRequiredException("Tên lớp đã tồn tại trong hệ thống!");
            }
        }

        // Nếu có lỗi thì throw
        if (errorMessage.length() > 0) {
            throw new FieldRequiredException("Validation error: " + errorMessage);
        }
    }

    // Validation cho UPDATE (có ID để exclude)
    public void fieldValidation(ClassRequest classRequest, Long excludeId) {
        StringBuilder errorMessage = new StringBuilder();

        // Validate teacherId
        if (classRequest.getTeacherId() == null) {
            appendMessage(errorMessage, "ID giáo viên không được để trống!");
        }

        String className = classRequest.getClassName();

        // Validate className null or empty
        if (isNullOrEmpty(className)) {
            appendMessage(errorMessage, "Tên lớp không được để trống!");
        } else {
            // Validate className length
            if (className.length() < 3 || className.length() > 20) {
                throw new FieldRequiredException("Tên lớp phải trong phạm vi từ 3 đến 20 ký tự!");
            }

            // Validate duplicate className
            boolean exists;
            if (excludeId != null) {
                exists = classRepository.existsByClassNameAndStatusNotAndIdNot(
                        className.trim(),
                        -1,
                        excludeId
                );
            } else {
                exists = classRepository.existsByClassNameAndStatusNot(
                        className.trim(),
                        -1
                );
            }

            if (exists) {
                throw new FieldRequiredException("Tên lớp đã tồn tại trong hệ thống!");
            }
        }

        // Nếu có lỗi thì throw
        if (errorMessage.length() > 0) {
            throw new FieldRequiredException("Validation error: " + errorMessage);
        }
    }

    private boolean isNullOrEmpty(String s) {
        return s == null || s.trim().isEmpty();
    }

    private void appendMessage(StringBuilder sb, String message) {
        if (sb.length() > 0) sb.append(" ");
        sb.append(message);
    }
}
