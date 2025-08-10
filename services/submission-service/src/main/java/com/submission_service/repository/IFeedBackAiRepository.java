package com.submission_service.repository;

import com.submission_service.model.entity.FeedbackAi;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IFeedBackAiRepository extends JpaRepository<FeedbackAi, Integer> {
}
