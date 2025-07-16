package com.defty.class_management_service.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "class_enrollments", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"class_id", "student_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private Class classroom;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "enrollment_date", nullable = false, updatable = false)
    private LocalDateTime enrollmentDate;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @PrePersist
    protected void onCreate() {
        enrollmentDate = LocalDateTime.now();
        if (status == null) {
            status = "ACTIVE";
        }
    }
}
