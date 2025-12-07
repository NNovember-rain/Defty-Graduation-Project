package com.defty.question_bank_service.dto.response;

import com.defty.question_bank_service.enums.TestSource;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestCollectionSummaryResponse {
    private Long id;
    private String collectionName;
    private String collectionCode;
    private TestSource source;
    private Integer year;
    private Integer totalTests;
}