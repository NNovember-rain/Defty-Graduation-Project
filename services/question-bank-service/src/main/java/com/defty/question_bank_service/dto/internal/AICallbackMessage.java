package com.defty.question_bank_service.dto.internal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AICallbackMessage {
    private String uploadId;
    private String fileStoragePath;
    private String status;
    private String error;
    private String reason;
    private TestSetData data;
    private String details;
}