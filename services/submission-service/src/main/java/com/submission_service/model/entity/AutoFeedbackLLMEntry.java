package com.submission_service.model.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "auto_feedback_llm_entry")
public class AutoFeedbackLLMEntry extends BaseEntity {

    @Column(columnDefinition = "TEXT", nullable = false)
    String studentPlantUMLCode;

    @Column(columnDefinition = "TEXT")
    String feedBackLLM;

//    @Enumerated(EnumType.STRING)
//    EntryStatus status;

    @Column(columnDefinition = "TEXT")
    String studentInfo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auto_feedback_llm_job_id")
    AutoFeedbackLLMJob autoFeedbackLLMJob;

    @Builder.Default
    @Column
    Boolean deleted = false;
}
