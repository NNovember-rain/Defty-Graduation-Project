package com.submission_service.model.entity;

import com.submission_service.enums.SubmissionStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

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

    @Column(nullable = false)
    Long moduleId;

    @Column(nullable = false)
    Long typeUmlId;

    @Column
    Double score;

    @Column
    @Builder.Default
    Boolean examMode=false;

    @Column(columnDefinition = "TEXT", nullable = false)
    String studentPlantUMLCode;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    SubmissionStatus submissionStatus=SubmissionStatus.SUBMITTED;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "feedback_ai_id", referencedColumnName = "id")
    private FeedbackAi feedbackAi;

    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<FeedbackTeacher> feedbackTeachers;

}
