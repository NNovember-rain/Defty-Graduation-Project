package com.defty.class_management_service.repository;


import com.defty.class_management_service.entity.ClassEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface IClassRepository extends JpaRepository<ClassEntity, Long> {

    ClassEntity findByIdAndStatus(Long classId, Integer Status);
    boolean existsByClassNameAndStatusNot(String className, int status);
    boolean existsByClassNameAndStatusNotAndIdNot(String className, Integer status, Long id);
    Optional<ClassEntity> findByInviteCode(String inviteCode);
    boolean existsByInviteCode(String inviteCode);

    @Query("SELECT c FROM ClassEntity c WHERE c.status != -1 AND c.id = :id")
    Optional<ClassEntity> findActiveById(@Param("id") Long id);
    @Query("SELECT c FROM ClassEntity c " +
            "WHERE c.id = :id AND c.teacherId = :teacherId AND c.status = 1")
    Optional<ClassEntity> findByActiveByTeacherId(@Param("id") Long id,
                                                  @Param("teacherId") Long teacherId);

    @Query("SELECT c FROM ClassEntity c " +
            "JOIN c.enrollmentEntities e " +
            "WHERE c.id = :classId AND e.studentId = :studentId AND e.status = 1")
    Optional<ClassEntity> findApprovedClassByStudentId(@Param("classId") Long classId,
                                                       @Param("studentId") Long studentId);

    @Query("SELECT c FROM ClassEntity c WHERE c.id IN :ids AND c.status = 1")
    List<ClassEntity> findAllActiveByIdIn(@Param("ids") List<Long> ids);

    @Query(value = "SELECT c FROM ClassEntity c WHERE " +
            "(:teacherId IS NULL OR c.teacherId = :teacherId) AND " +
            "(c.status != -1) AND " +
            "(:status IS NULL OR c.status = :status) " +
            "ORDER BY c.createdDate DESC",
            countQuery = "SELECT count(c) FROM ClassEntity c WHERE " +
                    "(:className IS NULL OR c.className LIKE %:className%) AND " +
                    "(c.status != -1) AND " +
                    "(:status IS NULL OR c.status = :status) ",
            nativeQuery = false)
    Page<ClassEntity> findAllByTeacherId(
            @Param("teacherId") Long teacherId,
            @Param("status") Integer status,
            Pageable pageable);

    Optional<ClassEntity> findByClassName(String className);

    @Query(value = """
    SELECT DISTINCT c.* FROM class c
    WHERE (:className IS NULL OR c.class_name LIKE CONCAT('%', REPLACE(:className, '_', '\\\\_'), '%') ESCAPE '\\\\')
      AND (c.status != -1)
      AND (:status IS NULL OR c.status = :status)
      AND (:teacherId IS NULL OR c.teacher_id = :teacherId)
      AND (:courseId IS NULL OR c.course_id = :courseId) 
    ORDER BY c.createddate DESC
    """,
            countQuery = """
    SELECT count(DISTINCT c.id) FROM class c
    WHERE (:className IS NULL OR c.class_name LIKE CONCAT('%', REPLACE(:className, '_', '\\\\_'), '%') ESCAPE '\\\\')
      AND (c.status != -1)
      AND (:status IS NULL OR c.status = :status)
      AND (:teacherId IS NULL OR c.teacher_id = :teacherId)
      AND (:courseId IS NULL OR c.course_id = :courseId) 
    """,
            nativeQuery = true)
    Page<ClassEntity> findClasses(
            @Param("className") String className,
            @Param("teacherId") Long teacherId,
            @Param("courseId") Long courseId,
            @Param("status") Integer status,
            Pageable pageable
    );

    @Query("SELECT DISTINCT c FROM ClassEntity c " +
            "JOIN c.enrollmentEntities e " +
            "WHERE e.studentId = :studentId " +
            "AND e.status = 1 " +
            "AND (:className IS NULL OR LOWER(c.className) LIKE LOWER(CONCAT('%', :className, '%')) ESCAPE '\\') " +
            "AND (:courseId IS NULL OR c.courseEntity.id = :courseId) " +
            "AND (:status IS NULL OR c.status = :status)")
    Page<ClassEntity> findClassesByStudentId(
            @Param("studentId") Long studentId,
            @Param("className") String className,
            @Param("courseId") Long courseId,
            @Param("status") Integer status,
            Pageable pageable
    );
}
