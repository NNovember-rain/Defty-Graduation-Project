package com.submission_service.service;

import com.submission_service.model.dto.request.SubmissionRequest;
import com.submission_service.model.dto.response.AssignmentClassDetailResponse;
import com.submission_service.model.dto.response.LastSubmissionResonse;
import com.submission_service.model.dto.response.SubmissionDetailResponse;
import com.submission_service.model.dto.response.SubmissionResponse;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;

public interface SubmissionService {
    Long handleSubmission(SubmissionRequest submissionRequest);
    Page<SubmissionResponse> getSubmissions(int page, int size, String sortBy, String sortOrder, Long studentId,Long assignmentId, Long classId, LocalDateTime fromDate, LocalDateTime toDate);
    SubmissionDetailResponse getSubmission(Long id);
    String addScoreSubmission(Long id, Double point);
    LastSubmissionResonse getLastSubmissionsExamMode(Long classId, Long assignmentClassDetailId);
    Page<SubmissionResponse> getLastSubmissionsExamModes(int page, int size, String sortBy, String sortOrder, Long classId, Long assignmentClassDetailId);
    Page<SubmissionResponse> getSubmissionsHistoryExerciseMode(int page, int size, String sortBy, String sortOrder, Long classId, Long assignmentId, Long studentId, Long moduleId, Boolean examMode);
}
