package com.submission_service.service;

import com.submission_service.enums.SubmissionStatus;
import com.submission_service.model.buider.SubmissionSearchBuilder;
import com.submission_service.model.dto.request.SubmissionRequest;
import com.submission_service.model.dto.response.SubmissionDetailResponse;
import com.submission_service.model.dto.response.SubmissionHistoryResponse;
import com.submission_service.model.dto.response.SubmissionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;

public interface SubmissionService {
    Long handleSubmission(SubmissionRequest submissionRequest);
    Page<SubmissionResponse> getSubmissions(int page, int size, String sortBy, String sortOrder, String studentName, String studentCode, String assignmentTitle, String className, String classCode, LocalDateTime fromDate, LocalDateTime toDate);
    SubmissionResponse getSubmission(Long id);
    String addScoreSubmission(Long id, Double point);
    Page<SubmissionResponse> getAllSubmissionsForStudent(int page, int size, String sortBy, String sortOrder, Long classId, Long assignmentId, Long studentId);
    Page<SubmissionResponse> getSubmissionsForClass(int page, int size, String sortBy, String sortOrder, Long classId, Long assignmentId);
}
