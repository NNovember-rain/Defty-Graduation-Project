package com.submission_service.model.entity;

import com.submission_service.enums.SubmissionStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

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
    String studentName;

    @Column(nullable = false)
    String studentCode;

    @Column(nullable = false)
    String assignmentTitle;

    @Column(nullable = false)
    Long assignmentId;

    @Column(nullable = false)
    String umlType;

    @Column(nullable = false)
    Long classId;

    @Column(nullable = false)
    String classCode;

    @Column
    Double score;

    @Column(columnDefinition = "TEXT", nullable = false)
    String studentPlantUMLCode;

//    String submissionFile;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    SubmissionStatus submissionStatus=SubmissionStatus.PROCESSING;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "feedback_ai_id", referencedColumnName = "id")
    private FeedbackAi feedbackAi;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "feedback_teacher_id", referencedColumnName = "id")
    private FeedbackTeacher feedbackTeacher;

}
