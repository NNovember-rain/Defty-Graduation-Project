package com.defty.question_bank_service.service.impl;

import com.defty.question_bank_service.entity.TestSetEntity;
import com.defty.question_bank_service.entity.TestSetStatsEntity;
import com.defty.question_bank_service.repository.ITestSetRepository;
import com.defty.question_bank_service.repository.TestSetStatsRepository;
import com.defty.question_bank_service.service.TestSetStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TestSetStatsServiceImpl implements TestSetStatsService {

    private final TestSetStatsRepository statsRepository;
    private final ITestSetRepository testSetRepository;

    @Override
    @Transactional
    public void increaseAttemptCount(UUID testSetId) {
        TestSetStatsEntity stats = statsRepository.findByTestSetId(testSetId);

        if (stats == null) {
            TestSetEntity testSet = testSetRepository.findById(testSetId)
                    .orElseThrow(() -> new RuntimeException("TestSet not found"));

            stats = TestSetStatsEntity.builder()
                    .testSet(testSet)
                    .attemptCount(0L)
                    .commentCount(0L)
                    .build();
        }

        stats.setAttemptCount(stats.getAttemptCount() + 1);
        statsRepository.save(stats);
    }

    @Override
    @Transactional
    public void increaseCommentCount(UUID testSetId) {
        TestSetStatsEntity stats = statsRepository.findByTestSetId(testSetId);

        if (stats == null) {
            TestSetEntity testSet = testSetRepository.findById(testSetId)
                    .orElseThrow(() -> new RuntimeException("TestSet not found"));

            stats = TestSetStatsEntity.builder()
                    .testSet(testSet)
                    .attemptCount(0L)
                    .commentCount(0L)
                    .build();
        }

        stats.setCommentCount(stats.getCommentCount() + 1);
        statsRepository.save(stats);
    }

    @Override
    public void reduceCountComment(UUID testSetId, Long count) {
        TestSetStatsEntity stats = statsRepository.findByTestSetId(testSetId);

        if (stats == null) {
            TestSetEntity testSet = testSetRepository.findById(testSetId)
                    .orElseThrow(() -> new RuntimeException("TestSet not found"));

            stats = TestSetStatsEntity.builder()
                    .testSet(testSet)
                    .attemptCount(0L)
                    .commentCount(0L)
                    .build();
        }

        stats.setCommentCount(stats.getCommentCount()-count);
        statsRepository.save(stats);
    }
}
