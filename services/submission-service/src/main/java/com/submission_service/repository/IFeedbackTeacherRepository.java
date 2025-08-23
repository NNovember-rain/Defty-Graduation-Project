package com.submission_service.repository;

import com.submission_service.model.entity.FeedbackTeacher;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IFeedbackTeacherRepository extends JpaRepository<FeedbackTeacher,Long> {
}
