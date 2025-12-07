package com.defty.question_bank_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "class_testset",
        uniqueConstraints = @UniqueConstraint(columnNames = {"class_id", "test_set_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassTestSetEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "class_id", nullable = false)
    private Long classId; // Reference to Class in class_management_service

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_set_id", nullable = false)
    private TestSetEntity testSet;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "assigned_by")
    private Long assignedBy; // Teacher ID who assigned this

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}