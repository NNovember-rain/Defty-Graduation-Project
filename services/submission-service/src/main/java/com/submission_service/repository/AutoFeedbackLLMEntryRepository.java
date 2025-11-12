package com.submission_service.repository;

import com.submission_service.model.entity.AutoFeedbackLLMEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AutoFeedbackLLMEntryRepository extends JpaRepository<AutoFeedbackLLMEntry, Long>, JpaSpecificationExecutor<AutoFeedbackLLMEntry> {
}
