package com.submission_service.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "student_llm_feedback")
public class StudentReviewLLMFeedback extends BaseEntity {
    @Column(nullable = false)
    private Long studentId;

    @Column
    private Integer rating;

    @Column(nullable = false)
    private String content;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "submission_id", referencedColumnName = "id")
    private Submission submission;
}