package com.submission_service.repository;

import com.submission_service.model.entity.AutoFeedbackLLMJob;
import com.submission_service.model.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AutoFeedbackLLMJobRepository extends JpaRepository<AutoFeedbackLLMJob,Long>, JpaSpecificationExecutor<AutoFeedbackLLMJob> {
}
