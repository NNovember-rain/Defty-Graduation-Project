package com.defty.class_management_service.repository;

import com.defty.class_management_service.entity.CourseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ICourseRepository extends JpaRepository<CourseEntity, Long> {
    boolean existsByCourseNameAndStatusNot(String courseName, Integer status);
    boolean existsByCourseNameAndStatusAndIdNot(String courseName, Integer status, Long id);

    @Query("SELECT c FROM CourseEntity c WHERE c.status != -1 AND c.id = :id")
    Optional<CourseEntity> findActiveById(@Param("id") Long id);

    @Query("SELECT c FROM CourseEntity c " +
            "WHERE c.status != -1 " +
            "AND (:courseName IS NULL OR LOWER(c.courseName) LIKE LOWER(CONCAT('%', :courseName, '%'))) " +
            "AND (:status IS NULL OR c.status = :status)")
    Page<CourseEntity> findCourses(@Param("courseName") String courseName,
                                   @Param("status") Integer status,
                                   Pageable pageable);

    @Query("SELECT DISTINCT c FROM CourseEntity c " +
            "LEFT JOIN FETCH c.collectionMappings m " +
            "WHERE c.status != -1 " +
            "AND (:courseName IS NULL OR LOWER(c.courseName) LIKE LOWER(CONCAT('%', :courseName, '%'))) " +
            "AND (:status IS NULL OR c.status = :status)")
    Page<CourseEntity> findCoursesWithMappings(@Param("courseName") String courseName,
                                               @Param("status") Integer status,
                                               Pageable pageable);
}