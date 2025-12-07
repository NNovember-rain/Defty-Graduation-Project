package com.defty.question_bank_service.dto.request;

import com.defty.question_bank_service.enums.FileType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Data
public class FileBulkRequest {
    private UUID id;

    @NotNull(message = "File type must not be null")
    private FileType type;

    private Integer displayOrder;
}