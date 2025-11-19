package com.submission_service.repository;

import com.submission_service.model.entity.SubmissionFeedback;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IFeedbackSubmissionRepository extends JpaRepository<SubmissionFeedback,Long> {
}
