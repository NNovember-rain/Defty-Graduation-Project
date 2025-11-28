package com.defty.question_bank_service.service;

import java.util.UUID;

public interface TestSetStatsService {
    void increaseAttemptCount(UUID testSetId);
    void increaseCommentCount(UUID testSetId);
    void reduceCountComment (UUID testSetId, Long count);
}
