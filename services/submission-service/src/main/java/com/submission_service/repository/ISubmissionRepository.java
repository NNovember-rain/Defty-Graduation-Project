package com.submission_service.repository;

import com.submission_service.model.dto.response.SubmissionResponse;
import com.submission_service.model.entity.Submission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface ISubmissionRepository extends JpaRepository<Submission, Long>, JpaSpecificationExecutor<Submission> {
    Optional<Submission> findByIdAndStatus(Long id, Integer status);
    Page<Submission> findByStudentId(Long studentId, Pageable pageable);
}
