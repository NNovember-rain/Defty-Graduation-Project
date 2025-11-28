package com.defty.question_bank_service.dto.internal;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class FileProcessAiRequest {
    private UUID processId;
    private UUID testSetId;
    private String partType;

    private String filePath;

    private String callbackUrl;
}