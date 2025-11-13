package com.defty.class_management_service.repository;

import com.defty.class_management_service.entity.EnrollmentEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IEnrollmentRepository extends JpaRepository<EnrollmentEntity, Long> {
    boolean existsByClassIdAndStudentId(Long classId, Long studentId);

    Optional<EnrollmentEntity> findByClassIdAndStudentId(Long classId, Long studentId);

    @Query(value = "SELECT c FROM EnrollmentEntity c " +
            "WHERE c.classId = :classId AND c.status != -1",
            countQuery = "SELECT count(c) FROM EnrollmentEntity c " +
                    "WHERE c.classId = :classId AND c.status != -1")
    Page<EnrollmentEntity> findAllByClassId(@Param("classId") Long classId,
                                                         Pageable pageable);

    @Query(value = "SELECT c FROM EnrollmentEntity c " +
            "WHERE c.classId = :classId AND c.status = 1")
    List<EnrollmentEntity> findAllActiveByClassId(@Param("classId") Long classId);

//    @Query("SELECT e FROM EnrollmentEntity e " +
//            "JOIN FETCH e.student s " +
//            "WHERE e.classEntity.id = :classId " +
//            "AND e.status != 'LEFT' " +
//            "ORDER BY e.enrollmentDate DESC")
//    Page<EnrollmentEntity> findByClassIdWithStudentDetails(@Param("classId") Long classId, Pageable pageable);
//
//    @Query("SELECT e FROM Enrollment e " +
//            "JOIN FETCH e.classEntity c " +
//            "WHERE e.student.id = :studentId " +
//            "AND e.status = 'ACTIVE' " +
//            "ORDER BY e.enrollmentDate DESC")
//    Page<Enrollment> findByStudentIdWithClassDetails(@Param("studentId") Long studentId, Pageable pageable);
//
//    @Query("SELECT COUNT(e) FROM Enrollment e " +
//            "WHERE e.classEntity.id = :classId " +
//            "AND e.status = 'ACTIVE'")
//    long countActiveStudentsInClass(@Param("classId") Long classId);
//
//    List<Enrollment> findByClassIdAndStatus(Long classId, EnrollmentStatus status);
    List<EnrollmentEntity> findByClassIdAndStatus(Long classId, Integer status);
}
