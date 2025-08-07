package com.ai_feedback_service.repository;

import com.ai_feedback_service.model.entity.FeedbackAi;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IFeedBackAiRepository extends JpaRepository<FeedbackAi, Integer> {
}
