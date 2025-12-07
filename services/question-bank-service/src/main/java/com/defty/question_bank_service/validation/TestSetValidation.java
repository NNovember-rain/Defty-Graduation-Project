package com.defty.question_bank_service.validation;

import com.example.common_library.exceptions.FieldRequiredException;
import com.defty.question_bank_service.dto.request.TestSetRequest;
import com.defty.question_bank_service.repository.ITestSetRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.util.UUID;
@Component
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TestSetValidation {
    ITestSetRepository testSetRepository;
    public void fieldValidation(TestSetRequest testSetRequest, UUID excludeId) {
        StringBuilder errorMessage = new StringBuilder();

        if (isNullOrEmpty(testSetRequest.getTestName())) {
            appendMessage(errorMessage, "Tên test không được để trống!");
        }

        String tagName = testSetRequest.getTestName();
        if (tagName != null && (tagName.length() < 3 || tagName.length() > 100)) {
            throw new FieldRequiredException("Tên test phải trong phạm vi từ 3 đến 100 ký tự!");
        }
        if (tagName != null && !tagName.trim().isEmpty()) {
            boolean exists;
            if (excludeId != null) {
                exists = testSetRepository.existsByTestNameAndStatusAndIdNot(
                        testSetRequest.getTestName().trim(),
                        -1,
                        excludeId
                );
            } else {
                exists = testSetRepository.existsByTestNameAndStatusNot(
                        testSetRequest.getTestName().trim(),
                        -1
                );
            }

            if (exists) {
                throw new FieldRequiredException("Tên test đã tồn tại trong hệ thống!");
            }
        }
        // Nếu có lỗi thì throw
        if (errorMessage.length() > 0) {
            throw new FieldRequiredException(""+errorMessage);
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
