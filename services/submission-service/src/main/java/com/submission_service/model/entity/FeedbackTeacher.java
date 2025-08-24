package com.submission_service.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class FeedbackTeacher extends BaseEntity {

    private Long teacherId;
    private Double grade;
    private String content;

    @OneToOne(mappedBy = "feedbackTeacher")
    private Submission submission;
}
