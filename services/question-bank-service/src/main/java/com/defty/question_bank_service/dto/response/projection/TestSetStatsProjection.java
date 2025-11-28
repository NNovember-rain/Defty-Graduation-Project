package com.defty.question_bank_service.dto.response.projection;

import java.util.UUID;

public interface TestSetStatsProjection {
    UUID getTestSetId();
    Long getAttemptCount();
    Long getCommentCount();
}
