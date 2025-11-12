package com.defty.class_management_service.repository;

import com.defty.class_management_service.entity.CourseEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// Trong CourseCollectionMappingRepository
public interface ICourseCollectionMappingRepository extends JpaRepository<CourseCollectionMappingEntity, Long> {
    List<CourseCollectionMappingEntity> getAllByCourseEntity(CourseEntity courseEntity);
    void deleteByCourseEntity(CourseEntity courseEntity);
}