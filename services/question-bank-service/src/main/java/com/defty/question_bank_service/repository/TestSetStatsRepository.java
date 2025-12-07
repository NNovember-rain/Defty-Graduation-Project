package com.defty.question_bank_service.repository;

import com.defty.question_bank_service.entity.TestSetStatsEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TestSetStatsRepository extends JpaRepository<TestSetStatsEntity, UUID> {
    TestSetStatsEntity findByTestSetId(UUID testSetId);
}
