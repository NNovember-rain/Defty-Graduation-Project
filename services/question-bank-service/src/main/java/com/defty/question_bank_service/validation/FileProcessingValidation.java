package com.defty.question_bank_service.validation;

import com.example.common_library.exceptions.BadRequestException;
import com.example.common_library.exceptions.FieldRequiredException;
import com.defty.question_bank_service.dto.request.FileProcessingRequest;
import com.defty.question_bank_service.enums.PartType;
import com.defty.question_bank_service.repository.IFileProcessingRepository;
import com.defty.question_bank_service.repository.ITestSetRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.unit.DataSize;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Slf4j
public class FileProcessingValidation {

    final IFileProcessingRepository fileProcessingRepository;
    final ITestSetRepository testSetRepository;

    @Value("${file.upload.max-size}")
    String maxFileSizeStr;

    public void fieldValidation(FileProcessingRequest request) {
        StringBuilder errorMessage = new StringBuilder();

        if (request.getTestSetId() == null) {
            appendMessage(errorMessage, "Test Set ID không được để trống!");
        } else {
            boolean testSetExists = testSetRepository.existsByIdAndStatusNot(
                    request.getTestSetId(),
                    -1
            );
            if (!testSetExists) {
                appendMessage(errorMessage, "Không tìm thấy bộ đề với ID: " + request.getTestSetId());
            }
        }

        if (isNullOrEmpty(request.getPartType())) {
            appendMessage(errorMessage, "Loại phần thi không được để trống!");
        } else {
            try {
                PartType.valueOf(request.getPartType().toUpperCase());
            } catch (IllegalArgumentException e) {
                appendMessage(errorMessage, "Loại phần thi không hợp lệ. Chỉ chấp nhận: LC hoặc RC");
            }
        }

        if (request.getFile() == null || request.getFile().isEmpty()) {
            appendMessage(errorMessage, "File đề thi không được để trống!");
        } else {
            validateFile(request.getFile(), errorMessage);
        }

        if (errorMessage.length() > 0) {
            throw new FieldRequiredException(errorMessage.toString());
        }
    }

    private void validateFile(MultipartFile file, StringBuilder errorMessage) {
        DataSize maxFileSize = DataSize.parse(maxFileSizeStr);
        long maxFileSizeInBytes = maxFileSize.toBytes();

        if (file.getSize() > maxFileSizeInBytes) {
            long maxSizeMB = maxFileSize.toMegabytes();
            appendMessage(errorMessage,
                    String.format("File vượt quá kích thước cho phép (%d MB)!", maxSizeMB));
        }

        String fileName = file.getOriginalFilename();
        if (fileName == null || !fileName.toLowerCase().endsWith(".pdf")) {
            appendMessage(errorMessage, "Chỉ chấp nhận file PDF!");
        }

        if (fileName != null && fileName.length() > 255) {
            appendMessage(errorMessage, "Tên file quá dài (tối đa 255 ký tự)!");
        }
    }

    public void validateProcessingExists(UUID id) {
        if (!fileProcessingRepository.existsById(id)) {
            throw new BadRequestException("Không tìm thấy bản ghi xử lý với ID: " + id);
        }
    }

    private boolean isNullOrEmpty(String s) {
        return s == null || s.trim().isEmpty();
    }

    private void appendMessage(StringBuilder sb, String message) {
        if (sb.length() > 0) sb.append(" ");
        sb.append(message);
    }

    public long getMaxFileSizeInBytes() {
        return DataSize.parse(maxFileSizeStr).toBytes();
    }

    public DataSize getMaxFileSize() {
        return DataSize.parse(maxFileSizeStr);
    }
}