package com.defty.question_bank_service.entity;

import com.defty.question_bank_service.enums.PartType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "file_processing")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileProcessingEntity extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id")
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "part_type")
    private PartType partType;

    @Column(name = "total_questions_found")
    private Integer totalQuestionsFound;

    @Column(name = "questions_inserted")
    private Integer questionsInserted;

    @Column(name = "questions_duplicated")
    private Integer questionsDuplicated;

    @Column(name = "questions_failed")
    private Integer questionsFailed;

    @Column(name = "existing_questions_count")
    private Integer existingQuestionsCount;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    // Chi tiết các câu hỏi có vấn đề (JSON format)
    // Ví dụ: {"duplicates": [5, 12, 28], "errors": [45, 67]}
    @Column(name = "issue_details", columnDefinition = "TEXT")
    private String issueDetails;

    // Đánh dấu đã xử lý thủ công
    @Column(name = "manually_resolved")
    @Builder.Default
    private Boolean manuallyResolved = false;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_set_id", nullable = false)
    @JsonIgnore
    private TestSetEntity testSet;
}