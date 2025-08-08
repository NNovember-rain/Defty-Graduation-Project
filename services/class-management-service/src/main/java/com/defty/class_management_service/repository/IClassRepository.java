package com.defty.class_management_service.repository;


import com.defty.class_management_service.entity.ClassEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface IClassRepository extends JpaRepository<ClassEntity, Long> {
    @Query(value = "SELECT c FROM ClassEntity c WHERE " +
            "(:teacherId IS NULL OR c.teacherId = :teacherId) AND " +
            "(c.status != -1) AND " +
            "(:status IS NULL OR c.status = :status) " +
            "ORDER BY c.createdDate DESC",
            countQuery = "SELECT count(c) FROM ClassEntity c WHERE " +
                    "(:className IS NULL OR c.name LIKE %:className%) AND " +
                    "(c.status != -1) AND " +
                    "(:status IS NULL OR c.status = :status) ",
            nativeQuery = false)
    Page<ClassEntity> findAllByTeacherId(
            @Param("teacherId") Long teacherId,
            @Param("status") Integer status,
            Pageable pageable);

    @Query("SELECT c FROM ClassEntity c WHERE c.status != -1 AND c.id = :id")
    Optional<ClassEntity> findActiveById(@Param("id") Long id);

    Optional<ClassEntity> findByName(String name);

    @Query(value = "SELECT c FROM ClassEntity c WHERE " +
            "(:className IS NULL OR c.name LIKE %:className%) AND " +
            "(c.status != -1) AND " +
            "(:status IS NULL OR c.status = :status) AND " +
            "(:teacherId IS NULL OR c.teacherId = :teacherId) " +
            "ORDER BY c.createdDate DESC",
            countQuery = "SELECT count(c) FROM ClassEntity c WHERE " +
                    "(:className IS NULL OR c.name LIKE %:className%) AND " +
                    "(c.status != -1) AND " +
                    "(:status IS NULL OR c.status = :status) AND " +
                    "(:teacherId IS NULL OR c.teacherId = :teacherId)")
    Page<ClassEntity> findClasses(
            @Param("className") String className,
            @Param("teacherId") Long teacherId,
            @Param("status") Integer status,
            Pageable pageable);
}
