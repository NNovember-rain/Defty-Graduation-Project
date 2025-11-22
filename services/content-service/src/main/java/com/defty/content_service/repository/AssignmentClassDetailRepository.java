package com.defty.content_service.repository;

import com.defty.content_service.entity.AssignmentClassDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
public interface AssignmentClassDetailRepository extends JpaRepository<AssignmentClassDetail, Long> {
    List<AssignmentClassDetail> findByAssignmentClassId(Long assignmentClassId);
//    @Query("SELECT acd.module.id FROM AssignmentClassDetail acd " +
//            "JOIN acd.assignmentClass ac " +
//            "WHERE ac.classId = :classId")
//    Set<Long> findAssignedModuleIdsByClassId(@Param("classId") Long classId);

    @Query("""
    SELECT acd.module.id
    FROM AssignmentClassDetail acd
    JOIN acd.assignmentClass ac
    WHERE ac.classId = :classId
    """)
    Set<Long> findAssignedModuleIdsByClassId(@Param("classId") Long classId);

    List<AssignmentClassDetail> findAllByAssignmentClassIdAndChecked(Long assignmentClassId, boolean checked);
}
