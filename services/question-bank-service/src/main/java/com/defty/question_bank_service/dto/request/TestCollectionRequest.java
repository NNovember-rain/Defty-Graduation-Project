package com.defty.question_bank_service.dto.request;


import com.defty.question_bank_service.enums.TestSource;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestCollectionRequest {
    private String collectionName;

    private String slug;

    private String description;

    private Integer totalTests;
}