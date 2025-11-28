package com.defty.question_bank_service.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestCollectionResponse extends BaseResponse {
    private UUID id;
    private String collectionName;
    private String slug;
    private String description;
    private Integer totalTests;
    private Boolean isPublic;
}