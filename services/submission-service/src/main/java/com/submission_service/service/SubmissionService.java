package com.submission_service.service;

import com.submission_service.model.buider.SubmissionSearchBuilder;
import com.submission_service.model.dto.request.SubmissionRequest;
import com.submission_service.model.dto.response.SubmissionDetailResponse;
import com.submission_service.model.dto.response.SubmissionHistoryResponse;
import com.submission_service.model.dto.response.SubmissionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SubmissionService {
    Long handleSubmission(SubmissionRequest submissionRequest);
    Page<SubmissionResponse> getAllSubmissions(Pageable pageable, SubmissionSearchBuilder criteria);
    SubmissionDetailResponse getSubmission(Long id);
    String addScoreSubmission(Long id, Double point);
    Page<SubmissionHistoryResponse> getAllSubmissionsForStudent(Pageable pageable, Long studentId);

}
