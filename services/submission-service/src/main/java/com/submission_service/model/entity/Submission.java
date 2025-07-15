package com.submission_service.model.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class Submission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private Integer studentId;
    private Integer assignmentId;
    private String plantUMLCode;
    private String submissionFile;
    private String status;
    private LocalDateTime createdAt;
}
