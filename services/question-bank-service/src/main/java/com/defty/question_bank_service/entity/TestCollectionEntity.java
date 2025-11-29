package com.defty.question_bank_service.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.*;

@Entity
@Table(name = "test_collection")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestCollectionEntity extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id")
    private UUID id;

    @Column(name = "collection_name", nullable = false)
    private String collectionName;

    @Column(name = "slug", unique = true)
    private String slug;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "total_tests")
    private Integer totalTests = 0;

    @Column(name = "is_public")
    @Builder.Default
    private boolean isPublic = false;

    @OneToMany(mappedBy = "collection", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private Set<TestSetEntity> testSets = new HashSet<>();
}