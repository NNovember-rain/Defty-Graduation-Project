package com.submission_service.model.entity;

import com.submission_service.enums.SubmissionStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Submission extends BaseEntity {

    @Column(nullable = false)
    Integer studentId;

    @Column(nullable = false)
    Integer assignmentId;

    @Column(nullable = false)
    Integer classId;

    @Column
    Double score;

    @Lob
    @Column(columnDefinition = "TEXT", nullable = false)
    String studentPlantUMLCode;

//    String submissionFile;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    SubmissionStatus status;

}
