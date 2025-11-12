package com.submission_service.model.entity;

import com.submission_service.enums.TypeUml;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "auto_feedback_llm_job")
public class AutoFeedbackLLMJob extends BaseEntity {

    @Column
    String title;

    @Column(columnDefinition = "TEXT")
    String assignment;

    @Enumerated(EnumType.STRING)
    TypeUml typeUml;

    @Column(columnDefinition = "TEXT")
    String solutionCode;

//    @Enumerated(EnumType.STRING)
//    JobStatus status;

    @Builder.Default
    @Column
    Boolean deleted = false;

    @OneToMany(mappedBy = "autoFeedbackLLMJob", cascade = CascadeType.ALL, orphanRemoval = true)
    List<AutoFeedbackLLMEntry> entries;

}
