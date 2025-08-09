package com.submission_service.model.entity;

import com.submission_service.enums.SubmissionStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Getter
@Setter
public class Submission extends BaseEntity {

    @Column(nullable = false)
    Long studentId;

    @Column(nullable = false)
    Long assignmentId;

    @Column(nullable = false)
    Long classId;

    @Column
    Double score;

    @Lob
    @Column(columnDefinition = "TEXT", nullable = false)
    String studentPlantUMLCode;

//    String submissionFile;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    SubmissionStatus submissionStatus=SubmissionStatus.PROCESSING;

}
