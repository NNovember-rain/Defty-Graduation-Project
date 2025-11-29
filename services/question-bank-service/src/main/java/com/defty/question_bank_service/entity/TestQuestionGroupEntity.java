package com.defty.question_bank_service.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(
        name = "test_question_group",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"test_set_id", "question_group_id"})
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestQuestionGroupEntity extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id")
    private UUID id;

    @Column(name = "question_part_order")
    private Integer questionPartOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_set_id", nullable = false)
    @JsonIgnore
    private TestSetEntity testSet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_group_id", nullable = false)
    @JsonIgnore
    private QuestionGroupEntity questionGroup;
}
