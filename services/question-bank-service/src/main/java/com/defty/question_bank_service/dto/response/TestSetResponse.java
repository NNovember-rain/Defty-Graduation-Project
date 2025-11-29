package com.defty.question_bank_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestSetResponse{
    private UUID id;
    private String testName;
    private String slug;
    private Integer testNumber;
    private String description;
    private Integer totalQuestions;
    private UUID collectionId;
    private String collectionName;
    private UUID directionSetId;
    private LocalDateTime createdDate;
    private String createdBy;
    private LocalDateTime modifiedDate;
    private String modifiedBy;
    private Integer status;
    private Integer testUserCount;
    private Integer duration;
    private Integer partCount;
    private Boolean isPublic;
    private Boolean isTaken;

    private Long attemptCount;
    private Long commentCount;
}
