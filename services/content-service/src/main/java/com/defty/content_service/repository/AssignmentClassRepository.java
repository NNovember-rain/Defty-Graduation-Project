package com.defty.content_service.repository;

import com.defty.content_service.entity.Assignment;
import com.defty.content_service.entity.AssignmentClass;
import com.defty.content_service.enums.TypeUml;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentClassRepository extends JpaRepository<AssignmentClass, Long> {
    List<AssignmentClass> findByAssignmentId(Long assignmentId);

    Optional<AssignmentClass> findByAssignmentIdAndClassId(Long assignmentId, Long classId);
    @Query("""
        SELECT ac FROM AssignmentClass ac
        JOIN FETCH ac.assignment a
        LEFT JOIN FETCH ac.assignmentClassDetails d
        LEFT JOIN FETCH d.module m
        WHERE ac.classId = :classId
    """)
    List<AssignmentClass> findAllByClassIdFetch(@Param("classId") Long classId, Pageable pageable);

    @Query("SELECT COUNT(ac) FROM AssignmentClass ac WHERE ac.classId = :classId")
    long countByClassId(@Param("classId") Long classId);
}
