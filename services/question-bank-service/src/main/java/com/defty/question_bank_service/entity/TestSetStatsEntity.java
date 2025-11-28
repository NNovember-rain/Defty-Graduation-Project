package com.defty.question_bank_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "test_set_stats")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestSetStatsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_set_id", nullable = false, unique = true)
    private TestSetEntity testSet;

    @Column(name = "attempt_count", nullable = false)
    @Builder.Default
    private Long attemptCount = 0L;

    @Column(name = "comment_count", nullable = false)
    @Builder.Default
    private Long commentCount = 0L;
}