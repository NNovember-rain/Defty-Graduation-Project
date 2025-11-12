package com.submission_service.service;

import com.submission_service.enums.TypeUml;
import com.submission_service.model.dto.response.AutoFeedbackLLMJobDetailResponse;
import com.submission_service.model.dto.response.AutoFeedbackLLMJobResponse;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

public interface AutoFeedbackLLMJobService {
    Long handaleAutoFeedbackLLMJob(MultipartFile file);
    Page<AutoFeedbackLLMJobResponse> getAutoFeedbackLLMJobs(String title, TypeUml typeUml, LocalDateTime fromDate, LocalDateTime toDate, int page, int size, String sortBy, String sortOrder);
    AutoFeedbackLLMJobDetailResponse getAutoFeedbackLLMJobDetail(Long jobId);
    String deleteAutoFeedbackLLMJobs(List<Long> jobIds);
}
