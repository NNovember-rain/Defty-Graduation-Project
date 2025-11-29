package com.defty.question_bank_service.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
@Entity
@Table(
        name = "question_tag_mapping",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"question_id", "tag_id"})
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionTagMappingEntity extends BaseEntity {
    @EqualsAndHashCode.Include
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    @JsonIgnore
    private QuestionEntity question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tag_id", nullable = false)
    @JsonIgnore
    private QuestionTagEntity questionTag;
}