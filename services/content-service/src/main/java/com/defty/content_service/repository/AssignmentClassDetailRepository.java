package com.defty.content_service.repository;

import com.defty.content_service.entity.AssignmentClassDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AssignmentClassDetailRepository extends JpaRepository<AssignmentClassDetail, Long> {
}
