package com.submission_service.repository;

import com.submission_service.model.dto.response.SubmissionResponse;
import com.submission_service.model.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ISubmissionRepository extends JpaRepository<Submission, Integer> {

}
