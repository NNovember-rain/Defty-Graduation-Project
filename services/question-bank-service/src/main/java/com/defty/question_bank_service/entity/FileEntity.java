package com.defty.question_bank_service.entity;

import com.defty.question_bank_service.enums.FileType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
@Entity
@Table(name = "file")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FileEntity extends BaseEntity {
    @EqualsAndHashCode.Include
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id")
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private FileType type;

    @Column(name = "url", nullable = false)
    private String url;

    @Column(name = "display_order")
    private Integer displayOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_group_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private QuestionGroupEntity questionGroup;
}