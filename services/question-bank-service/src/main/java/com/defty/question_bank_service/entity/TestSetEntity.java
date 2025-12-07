package com.defty.question_bank_service.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.*;

@Entity
@Table(name = "test_set")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestSetEntity extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id")
    private UUID id;

    @Column(name = "test_name", nullable = false)
    private String testName;

    @Column(name = "slug", unique = true)
    private String slug;

    @Column(name = "test_number")
    private Integer testNumber;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "total_question")
    private Integer totalQuestions;

    @Column(name = "is_public")
    @Builder.Default
    private boolean isPublic = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collection_id")
    @JsonIgnore
    private TestCollectionEntity collection;

    @OneToMany(mappedBy = "testSet", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private Set<TestQuestionGroupEntity> testQuestionGroups = new HashSet<>();
    @OneToMany(
            mappedBy = "testSet",
            cascade = CascadeType.ALL,
            fetch = FetchType.LAZY,
            orphanRemoval = true
    )
    @JsonIgnore
    @Builder.Default
    private Set<FileProcessingEntity> fileProcesses = new HashSet<>();

    @OneToOne(mappedBy = "testSet", cascade = CascadeType.ALL)
    @JsonIgnore
    private TestSetStatsEntity stats;
}