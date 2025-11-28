package com.defty.question_bank_service.dto.request;

import com.defty.question_bank_service.enums.FileType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Data
public class FileRequest {

    @NotNull(message = "File type must not be null")
    private FileType type;

    @NotNull(message = "Question group ID must not be null")
    private UUID questionGroupId;

    private Integer displayOrder;
}