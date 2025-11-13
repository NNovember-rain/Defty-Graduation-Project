package com.submission_service.service;

import com.submission_service.model.dto.response.AutoFeedbackLLMEntryResponse;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;

public interface AutoFeedbackLLMEntryService {
    Page<AutoFeedbackLLMEntryResponse> getAutoFeedbackLLMEntries(Long jobId, String studentInfo, LocalDateTime fromDate, LocalDateTime toDate, int page, int size, String sortBy, String sortOrder);
}
