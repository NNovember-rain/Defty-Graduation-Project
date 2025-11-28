package com.defty.question_bank_service.repository;

import com.defty.question_bank_service.entity.AnswerEntity;
import com.defty.question_bank_service.entity.QuestionEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IAnswerRepository extends JpaRepository<AnswerEntity, UUID> {

    /* =========================
       BASIC FINDERS WITH STATUS
       ========================= */
    Optional<AnswerEntity> findByIdAndStatus(UUID id, Integer status);

    List<AnswerEntity> findByStatus(Integer status);

    @Query(value = """
        SELECT a FROM AnswerEntity a
        WHERE (:questionId IS NULL OR a.question.id = :questionId)
          AND a.status <> :deletedStatus
          AND (:status IS NULL OR a.status = :status)
    """,
            countQuery = """
        SELECT COUNT(a) FROM AnswerEntity a
        WHERE (:questionId IS NULL OR a.question.id = :questionId)
          AND a.status <> :deletedStatus
          AND (:status IS NULL OR a.status = :status)
    """)
    Page<AnswerEntity> findWithFilters(@Param("questionId") UUID questionId,
                                       @Param("deletedStatus") Integer deletedStatus,
                                       @Param("status") Integer status,
                                       Pageable pageable);

    @Query("""
        SELECT a FROM AnswerEntity a
        WHERE a.id = :id AND a.status <> :deletedStatus
    """)
    Optional<AnswerEntity> findByIdAndNotDeleted(@Param("id") UUID id,
                                                 @Param("deletedStatus") Integer deletedStatus);

    /* =========================
       QUESTION BASED
       ========================= */
    List<AnswerEntity> findByQuestionAndStatus(QuestionEntity question, Integer status);

    List<AnswerEntity> findByQuestionIdAndStatus(UUID questionId, Integer status);

    Optional<AnswerEntity> findByQuestionIdAndIsCorrectTrueAndStatus(UUID questionId, Integer status);

    List<AnswerEntity> findAllByQuestionIdAndIsCorrectTrueAndStatus(UUID questionId, Integer status);

    /* =========================
       DELETE OPERATIONS
       ========================= */
    void deleteByQuestionId(UUID questionId); // Hard delete

    /* =========================
       COUNT OPERATIONS
       ========================= */
    long countByQuestionIdAndStatus(UUID questionId, Integer status);

    long countByStatus(Integer status);

    @Modifying
    @Query("UPDATE AnswerEntity a SET a.status = :status WHERE a.id IN :ids")
    void batchUpdateStatus(@Param("ids") List<UUID> ids, @Param("status") Integer status);

    @Query("SELECT a FROM AnswerEntity a WHERE a.question.id IN :questionIds AND a.status <> :deletedStatus")
    List<AnswerEntity> findByQuestionIdInAndStatusNot(@Param("questionIds") List<UUID> questionIds,
                                                      @Param("deletedStatus") Integer deletedStatus);
}