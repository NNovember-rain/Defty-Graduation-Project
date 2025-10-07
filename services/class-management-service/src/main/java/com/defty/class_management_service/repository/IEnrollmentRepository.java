package com.defty.class_management_service.repository;

import com.defty.class_management_service.entity.ClassEnrollmentEntity;
import com.defty.class_management_service.entity.ClassEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface IEnrollmentRepository extends JpaRepository<ClassEnrollmentEntity, Long> {
    @Query(value = "SELECT c FROM ClassEnrollmentEntity c WHERE c.status != -1 AND" +
            "(:studentId IS NULL OR c.studentId = :studentId)",
            countQuery = "SELECT count(c) FROM ClassEnrollmentEntity c WHERE c.status != -1 AND" +
                    "(:studentId IS NULL OR c.studentId = :studentId)",
            nativeQuery = false)
    Page<ClassEnrollmentEntity> findAllByStudentId(@Param("studentId") Long studentId,
                                                   Pageable pageable);

    @Query(value = "SELECT c FROM ClassEnrollmentEntity c " +
            "WHERE c.classroom.id = :classId AND c.status = 1",
            countQuery = "SELECT count(c) FROM ClassEnrollmentEntity c " +
                    "WHERE c.classroom.id = :classId AND c.status = 1")
    Page<ClassEnrollmentEntity> findAllActiveByClassroom(@Param("classId") Long classId,
                                                         Pageable pageable);

    boolean existsByClassroomAndStudentId(ClassEntity classEntity, Long studentId);

}
