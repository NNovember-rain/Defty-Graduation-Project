package com.ai_feedback_service.model.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class StudentAiFeedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;

}