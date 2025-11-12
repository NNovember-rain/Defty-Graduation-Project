package com.defty.class_management_service.validation;

import com.defty.class_management_service.dto.request.CourseRequest;
import com.defty.class_management_service.repository.ICourseRepository;
import com.example.common_library.exceptions.FieldRequiredException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Component
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CourseValidation {
    ICourseRepository testCollectionRepository;

    // Regex pattern for hex color validation
    private static final Pattern HEX_COLOR_PATTERN = Pattern.compile("^#([0-9A-F]{3}|[0-9A-F]{6})$", Pattern.CASE_INSENSITIVE);

    public void fieldValidation(CourseRequest courseRequest, Long excludeId) {
        StringBuilder errorMessage = new StringBuilder();

        // Validate course name
        if (isNullOrEmpty(courseRequest.getCourseName())) {
            appendMessage(errorMessage, "Tên khóa học không được để trống!");
        }

        // Validate course name length
        String courseName = courseRequest.getCourseName();
        if (courseName != null && (courseName.trim().length() < 3 || courseName.trim().length() > 100)) {
            throw new FieldRequiredException("Tên khóa học phải trong phạm vi từ 3 đến 100 ký tự!");
        }

        // Check duplicate course name
        if (courseName != null && !courseName.trim().isEmpty()) {
            boolean exists;
            if (excludeId != null) {
                // For UPDATE: check duplicate excluding current record
                exists = testCollectionRepository.existsByCourseNameAndStatusAndIdNot(
                        courseRequest.getCourseName().trim(),
                        -1,
                        excludeId
                );
            } else {
                // For CREATE: check duplicate normally
                exists = testCollectionRepository.existsByCourseNameAndStatusNot(
                        courseRequest.getCourseName().trim(),
                        -1
                );
            }

            if (exists) {
                throw new FieldRequiredException("Tên khóa học đã tồn tại trong hệ thống!");
            }
        }

        // Validate description length (optional field)
        if (courseRequest.getDescription() != null && courseRequest.getDescription().trim().length() > 500) {
            throw new FieldRequiredException("Mô tả không được vượt quá 500 ký tự!");
        }

        // Validate color field (optional)
        if (!isNullOrEmpty(courseRequest.getColor())) {
            String color = courseRequest.getColor().trim();
            if (!isValidHexColor(color)) {
                throw new FieldRequiredException("Màu sắc phải là mã hex hợp lệ! Định dạng: #RRGGBB (6 ký tự) hoặc #RGB (3 ký tự). Ví dụ: #FF5733, #F53");
            }
        }

        // Nếu có lỗi thì throw
        if (errorMessage.length() > 0) {
            throw new FieldRequiredException("" + errorMessage);
        }
    }

    private boolean isNullOrEmpty(String s) {
        return s == null || s.trim().isEmpty();
    }

    private void appendMessage(StringBuilder sb, String message) {
        if (sb.length() > 0) sb.append(" ");
        sb.append(message);
    }

    private boolean isValidHexColor(String color) {
        if (color == null || color.trim().isEmpty()) {
            return false;
        }

        String trimmedColor = color.trim();

        // Must start with #
        if (!trimmedColor.startsWith("#")) {
            return false;
        }

        // Check length and pattern
        return HEX_COLOR_PATTERN.matcher(trimmedColor).matches();
    }
}