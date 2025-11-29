package com.defty.question_bank_service.repository;

import com.defty.question_bank_service.entity.QuestionEntity;
import com.defty.question_bank_service.entity.QuestionGroupEntity;
import com.defty.question_bank_service.enums.DifficultyLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IQuestionRepository extends JpaRepository<QuestionEntity, UUID> {

    /* =======================================================
       BASIC QUERIES WITHOUT JOIN (chỉ query QuestionEntity)
       ======================================================= */

    List<QuestionEntity> findByStatus(Integer status);

    @Query("""
        SELECT DISTINCT q FROM QuestionEntity q
        LEFT JOIN FETCH q.answers a
        WHERE q.id = :id
          AND q.status <> :deletedStatus
    """)
    Optional<QuestionEntity> findByIdAndNotDeleted(@Param("id") UUID id,
                                                   @Param("deletedStatus") Integer deletedStatus);

    List<QuestionEntity> findByQuestionGroupIdAndStatus(UUID questionGroupId, Integer status);

    List<QuestionEntity> findByQuestionGroupIdAndDifficultyAndStatus(
            UUID questionGroupId,
            DifficultyLevel difficulty,
            Integer status
    );

    long countByQuestionGroupIdAndStatus(UUID questionGroupId, Integer status);

    void deleteByQuestionGroupId(UUID questionGroupId);

    Optional<QuestionEntity> findByIdAndStatus(UUID id, Integer status);

    @Query(value = """
        SELECT DISTINCT q FROM QuestionEntity q
        LEFT JOIN FETCH q.answers a
        WHERE (:groupId IS NULL OR q.questionGroup.id = :groupId)
          AND q.status <> :deletedStatus
          AND (a.status IS NULL OR a.status <> :deletedStatus)
          AND (:status IS NULL OR q.status = :status)
    """,
            countQuery = """
                SELECT COUNT(q) FROM QuestionEntity q
                WHERE (:groupId IS NULL OR q.questionGroup.id = :groupId)
                  AND q.status <> :deletedStatus
                  AND (:status IS NULL OR q.status = :status)
            """)
    Page<QuestionEntity> findWithFiltersAndAnswers(
            @Param("groupId") UUID groupId,
            @Param("deletedStatus") Integer deletedStatus,
            @Param("status") Integer status,
            Pageable pageable
    );

    /* =======================================================
       QUERIES WITH JOIN FETCH (tránh N+1, load luôn Answer)
       ======================================================= */

    // Lấy tất cả câu hỏi + đáp án theo status
    @Query("""
        SELECT DISTINCT q FROM QuestionEntity q
        LEFT JOIN FETCH q.answers a
        WHERE q.status = :status
    """)
    List<QuestionEntity> findAllWithAnswersByStatus(@Param("status") Integer status);

    // Lấy câu hỏi + đáp án theo groupId và status
    @Query("""
        SELECT DISTINCT q FROM QuestionEntity q
        LEFT JOIN FETCH q.answers a
        WHERE q.questionGroup.id = :groupId
          AND q.status = :status
          AND a.status = :answerStatus
    """)
    List<QuestionEntity> findWithAnswersByGroupIdAndStatus(
            @Param("groupId") UUID groupId,
            @Param("status") Integer questionStatus,
            @Param("answerStatus") Integer answerStatus
    );

    // Lấy câu hỏi + đáp án theo groupId, difficulty và status
    @Query("""
        SELECT DISTINCT q FROM QuestionEntity q
        LEFT JOIN FETCH q.answers a
        WHERE q.questionGroup.id = :groupId
          AND q.difficulty = :difficulty
          AND q.status = :status
          AND a.status = :answerStatus
    """)
    List<QuestionEntity> findWithAnswersByGroupIdAndDifficultyAndStatus(
            @Param("groupId") UUID groupId,
            @Param("difficulty") DifficultyLevel difficulty,
            @Param("status") Integer questionStatus,
            @Param("answerStatus") Integer answerStatus
    );

    @Modifying
    @Query("UPDATE QuestionEntity q SET q.status = :status WHERE q.id IN :ids")
    void batchUpdateStatus(@Param("ids") List<UUID> ids, @Param("status") Integer status);

    List<QuestionEntity> findByQuestionGroupAndStatus(QuestionGroupEntity group, Integer status);

    @EntityGraph(attributePaths = {
            "answers",
            "questionTagMappings",
            "questionTagMappings.questionTag"
    })
    @Query("""
    SELECT DISTINCT q FROM QuestionEntity q
    WHERE q.id IN :ids
""")
    List<QuestionEntity> findAllWithRelationsByIds(@Param("ids") List<UUID> ids);


}