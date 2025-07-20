package com.defty.content_service.repository;

import com.defty.content_service.entity.Assignment;
import com.defty.content_service.entity.AssignmentClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentClassRepository extends JpaRepository<AssignmentClass, Long> {
    List<AssignmentClass> findByAssignmentAndClassIdIn(Assignment assignment, List<Long> classIds);
    List<AssignmentClass> findByAssignmentId(Long assignmentId);
}
