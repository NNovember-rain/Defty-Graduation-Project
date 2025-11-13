package com.submission_service.repository;

import com.submission_service.model.entity.FeedbackLLM;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IFeedBackLLMRepository extends JpaRepository<FeedbackLLM, Long> {
}
