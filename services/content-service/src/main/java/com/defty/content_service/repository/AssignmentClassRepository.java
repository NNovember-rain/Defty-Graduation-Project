package com.defty.content_service.repository;

import com.defty.content_service.entity.AssignmentClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AssignmentClassRepository extends JpaRepository<AssignmentClass, Long> {

}
