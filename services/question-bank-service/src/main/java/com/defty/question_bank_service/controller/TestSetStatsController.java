package com.defty.question_bank_service.controller;

import com.defty.question_bank_service.service.TestSetStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/test-set-stats")
@RequiredArgsConstructor
public class TestSetStatsController {

    private final TestSetStatsService testSetStatsService;

    @PostMapping("/{testSetId}/attempt")
    public void increaseAttempt(@PathVariable UUID testSetId) {
        testSetStatsService.increaseAttemptCount(testSetId);
    }

    @PostMapping("/{testSetId}/comment")
    public void increaseComment(@PathVariable UUID testSetId) {
        testSetStatsService.increaseCommentCount(testSetId);
    }

    @PostMapping("/{testSetId}/comment/reduce")
    public void reduceCountComment(@PathVariable UUID testSetId, @RequestParam Long count) {
        testSetStatsService.reduceCountComment(testSetId, count);
    }
}
