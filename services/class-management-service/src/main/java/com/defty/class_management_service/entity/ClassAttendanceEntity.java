package com.defty.class_management_service.entity;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "class_attendance",
        uniqueConstraints = @UniqueConstraint(name = "unique_attendance", columnNames = {"class_id", "student_id", "attendance_date"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassAttendanceEntity extends BaseEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "class_id", nullable = false)
    private Long classId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "attendance_date", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate attendanceDate;

    @Column(name = "notes", length = 500)
    private String notes;

    // Many-to-one relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", insertable = false, updatable = false)
    private ClassEntity classEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", insertable = false, updatable = false)
    private EnrollmentEntity enrollmentEntity;
}