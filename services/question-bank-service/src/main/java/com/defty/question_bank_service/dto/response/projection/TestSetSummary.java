package com.defty.question_bank_service.dto.response.projection;

import java.time.LocalDateTime;
import java.util.UUID;

public interface TestSetSummary {
    UUID getId();
    String getTestName();
    String getSlug();
    Integer getTestNumber();
    String getDescription();
    UUID getCollectionId();
    String getCollectionName();
    Integer getStatus();
    Boolean getIsPublic();
    LocalDateTime getCreatedDate();
    LocalDateTime getModifiedDate();
    String getCreatedBy();
    String getModifiedBy();
    Long getTotalQuestions();
}
