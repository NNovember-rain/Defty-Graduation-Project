package com.defty.content_service.repository;

import com.defty.content_service.entity.ModuleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ModuleRepository extends JpaRepository<ModuleEntity, Long> {
    List<ModuleEntity> findAllById(Long moduleIds);
    List<ModuleEntity> findByAssignmentId(Long assignmentId);
    List<ModuleEntity> findByIdIn(List<Long> moduleIds);
}
