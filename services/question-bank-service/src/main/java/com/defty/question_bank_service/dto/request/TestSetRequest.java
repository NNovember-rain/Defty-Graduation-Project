package com.defty.question_bank_service.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestSetRequest {
    private String testName;

    private Integer testNumber;

    private String description;

    private UUID collectionId;

    private UUID directionSetId;
}