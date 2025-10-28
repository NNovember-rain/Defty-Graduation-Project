package com.submission_service.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class FeedbackTeacher extends BaseEntity {

    @Column(nullable = false)
    private Long teacherId;

    @Column(nullable = false)
    private String content;

    @ManyToOne
    @JoinColumn(name = "submission_id")
    private Submission submission;
}
