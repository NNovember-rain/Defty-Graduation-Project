package com.defty.question_bank_service.entity;

import com.defty.question_bank_service.enums.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.util.*;

@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
@Entity
@Table(name = "question_group")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionGroupEntity extends BaseEntity {
    @EqualsAndHashCode.Include
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id")
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_part")
    private ToeicPart questionPart;

    @Column(name = "audio_transcript", columnDefinition = "TEXT")
    private String audioTranscript;

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "passage_text", columnDefinition = "TEXT")
    private String passageText;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty")
    private DifficultyLevel difficulty;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "required_image")
    private Integer requiredImage;

    @Column(name = "required_audio")
    private Boolean requiredAudio;

    @Column(name = "question_group_order")
    private Integer questionGroupOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "source")
    private QuestionSource source;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_file_processing_id")
    @JsonIgnore
    @ToString.Exclude
    private FileProcessingEntity sourceFileProcessing;

    @OneToMany(mappedBy = "questionGroup", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @ToString.Exclude
    @OrderBy("questionNumber ASC")
    @Builder.Default
    private Set<QuestionEntity> questions = new LinkedHashSet<>();

    @OneToMany(mappedBy = "questionGroup", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @ToString.Exclude
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private Set<FileEntity> files = new LinkedHashSet<>();
}