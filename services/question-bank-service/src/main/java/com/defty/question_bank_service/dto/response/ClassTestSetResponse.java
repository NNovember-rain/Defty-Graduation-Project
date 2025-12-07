package com.defty.question_bank_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassTestSetResponse {
    private Long id;
    private Long classId;
    private UUID testSetId;
    private String testSetName;
    private String testSetSlug;
    private String collectionName;
    private Integer totalQuestions;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Long assignedBy;
    private Boolean isActive;
    private Integer status;
    private LocalDateTime createdDate;
    private LocalDateTime modifiedDate;
}