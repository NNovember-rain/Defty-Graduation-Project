package com.defty.class_management_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "enrollment",
        uniqueConstraints = @UniqueConstraint(name = "unique_enrollment", columnNames = {"class_id", "student_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentEntity extends BaseEntity{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "class_id", nullable = false)
    private Long classId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    // Many-to-one relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", insertable = false, updatable = false)
    private ClassEntity classEntity;

    // One-to-many relationships
    @OneToMany(mappedBy = "enrollmentEntity", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ClassAttendanceEntity> classAttendanceEntities;

    @OneToMany(mappedBy = "enrollmentEntity", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<EnrollmentHistoryEntity> enrollmentHistoryEntities;
}
