package com.defty.question_bank_service.repository;

import com.defty.question_bank_service.entity.QuestionTagEntity;
import jakarta.persistence.criteria.CriteriaBuilder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
public interface IQuestionTagRepository extends JpaRepository<QuestionTagEntity, UUID> {
    boolean existsByTagNameAndStatus(String tagName, Integer status);

    boolean existsByTagNameAndStatusAndIdNot(String tagName, Integer status, UUID id);
    Optional<QuestionTagEntity> findByIdAndStatusNot(UUID id, Integer status);
    Optional<QuestionTagEntity> findByIdAndStatus(UUID id, Integer status);

    List<QuestionTagEntity> findByStatusOrderByTagNameAsc(Integer status);
    List<QuestionTagEntity> findAllByIdInAndStatusNot(List<UUID> id, Integer status);

    @Query("""
       SELECT qt 
       FROM QuestionTagEntity qt
       WHERE (:tagName IS NULL OR qt.tagName ILIKE CONCAT('%', :tagName, '%')) 
         AND (:status IS NULL OR qt.status = :status)
         AND qt.status != -1 
       ORDER BY qt.createdDate DESC
       """)
    Page<QuestionTagEntity> findQuestionTags(
            @Param("tagName") String tagName,
            @Param("status") Integer status,
            Pageable pageable
    );
    @Query("SELECT qt, COUNT(qtm) as questionCount FROM QuestionTagEntity qt " +
            "LEFT JOIN qt.questionTagMappings qtm " +
            "WHERE qt.id = :id " +
            "GROUP BY qt")
    Object[] findQuestionTagWithCount(@Param("id") UUID id);
}
