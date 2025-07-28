package com.ai_feedback_service.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class StudentAiFeedback extends BaseEntity {

    @Column(nullable = false)
    private Long studentId;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;

}