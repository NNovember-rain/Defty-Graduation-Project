package com.defty.question_bank_service.repository;

import com.defty.question_bank_service.entity.QuestionGroupEntity;
import com.defty.question_bank_service.enums.DifficultyLevel;
import com.defty.question_bank_service.enums.ToeicPart;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IQuestionGroupRepository extends JpaRepository<QuestionGroupEntity, UUID> {

    /* ==============================================
       BASIC QUERIES WITHOUT JOIN
       ============================================== */

    Optional<QuestionGroupEntity> findByIdAndStatus(UUID id, Integer status);

    List<QuestionGroupEntity> findByStatus(Integer status);

    List<QuestionGroupEntity> findByDifficultyAndStatus(DifficultyLevel difficulty, Integer status);

    List<QuestionGroupEntity> findByQuestionPartAndStatus(ToeicPart questionPart, Integer status);

    long countByStatus(Integer status);

    @Query("""
        SELECT g FROM QuestionGroupEntity g
        WHERE g.id = :id
          AND g.status <> :deletedStatus
    """)
    Optional<QuestionGroupEntity> findByIdAndNotDeleted(@Param("id") UUID id,
                                                        @Param("deletedStatus") Integer deletedStatus);

    /* ==============================================
       QUERIES WITH JOIN FETCH (tránh N+1)
       ============================================== */

    @Query(value = """  
        SELECT DISTINCT g.* 
        FROM question_group g
        LEFT JOIN test_question_group tqg ON g.id = tqg.question_group_id AND tqg.status <> :deletedStatus
        LEFT JOIN test_set ts ON tqg.test_set_id = ts.id AND ts.status <> :deletedStatus
        LEFT JOIN question q ON g.id = q.question_group_id AND q.status <> :deletedStatus
        LEFT JOIN question_tag_mapping qtm ON q.id = qtm.question_id AND qtm.status <> :deletedStatus
        LEFT JOIN question_tag qt ON qtm.tag_id = qt.id AND qt.status <> :deletedStatus
        WHERE g.status <> :deletedStatus
          AND (:status IS NULL OR g.status = :status)
          AND (:source IS NULL OR g.source = :source)
          AND (:filterByTestSets = false OR ts.id = ANY(:testSetIds))
          AND (:excludeByTestSets = false OR g.id NOT IN (
              SELECT tqg2.question_group_id 
              FROM test_question_group tqg2 
              WHERE tqg2.test_set_id = ANY(:excludeTestSetIds) 
                AND tqg2.status <> :deletedStatus
          ))
          AND (:questionPart IS NULL OR g.question_part = :questionPart)
          AND (:difficulty IS NULL OR g.difficulty = :difficulty)
          AND (:filterByTags = false OR qt.id = ANY(:tagIds))
        """,
            countQuery = """
        SELECT COUNT(DISTINCT g.id)
        FROM question_group g
        LEFT JOIN test_question_group tqg ON g.id = tqg.question_group_id AND tqg.status <> :deletedStatus
        LEFT JOIN test_set ts ON tqg.test_set_id = ts.id AND ts.status <> :deletedStatus
        LEFT JOIN question q ON g.id = q.question_group_id AND q.status <> :deletedStatus
        LEFT JOIN question_tag_mapping qtm ON q.id = qtm.question_id AND qtm.status <> :deletedStatus
        LEFT JOIN question_tag qt ON qtm.tag_id = qt.id AND qt.status <> :deletedStatus
        WHERE g.status <> :deletedStatus
          AND (:status IS NULL OR g.status = :status)
          AND (:source IS NULL OR g.source = :source)
          AND (:filterByTestSets = false OR ts.id = ANY(:testSetIds))
          AND (:excludeByTestSets = false OR g.id NOT IN (
              SELECT tqg2.question_group_id 
              FROM test_question_group tqg2 
              WHERE tqg2.test_set_id = ANY(:excludeTestSetIds)
                AND tqg2.status <> :deletedStatus
          ))
          AND (:questionPart IS NULL OR g.question_part = :questionPart)
          AND (:difficulty IS NULL OR g.difficulty = :difficulty)
          AND (:filterByTags = false OR qt.id = ANY(:tagIds))
        """,
            nativeQuery = true)
    Page<QuestionGroupEntity> searchByMultipleFields(
            @Param("deletedStatus") Integer deletedStatus,
            @Param("status") Integer status,
            @Param("questionPart") String questionPart,
            @Param("difficulty") String difficulty,
            @Param("source") String source,
            @Param("testSetIds") UUID[] testSetIds,
            @Param("excludeTestSetIds") UUID[] excludeTestSetIds,
            @Param("tagIds") UUID[] tagIds,
            @Param("filterByTestSets") boolean filterByTestSets,
            @Param("excludeByTestSets") boolean excludeByTestSets,
            @Param("filterByTags") boolean filterByTags,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {
            "questions",
            "questions.answers",
            "questions.questionTagMappings",
            "questions.questionTagMappings.questionTag",
            "files"
    })
    @Query("SELECT DISTINCT g FROM QuestionGroupEntity g WHERE g.id IN :groupIds")
    List<QuestionGroupEntity> findAllWithDetailsByIds(@Param("groupIds") List<UUID> groupIds);

    @EntityGraph(attributePaths = {
            "questions",
            "questions.answers",
            "questions.questionTagMappings",
            "questions.questionTagMappings.questionTag",
            "files"
    })
    @Query("SELECT g FROM QuestionGroupEntity g WHERE g.status <> :deletedStatus")
    Page<QuestionGroupEntity> findAllFullNotDeleted(
            @Param("deletedStatus") Integer deletedStatus,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {
            "questions",
            "questions.answers",
            "questions.questionTagMappings",
            "questions.questionTagMappings.questionTag",
            "files"
    })
    @Query("SELECT g FROM QuestionGroupEntity g WHERE g.id = :id AND g.status <> :deletedStatus")
    Optional<QuestionGroupEntity> findFullDetailById(
            @Param("id") UUID id,
            @Param("deletedStatus") Integer deletedStatus
    );

    // Lấy tất cả nhóm câu hỏi + câu hỏi + đáp án (có lọc status)
    @Query("""
        SELECT DISTINCT g FROM QuestionGroupEntity g
        LEFT JOIN FETCH g.questions q
        LEFT JOIN FETCH q.answers a
        WHERE g.status = :groupStatus
          AND q.status = :questionStatus
          AND a.status = :answerStatus
    """)
    List<QuestionGroupEntity> findAllWithQuestionsAndAnswers(
            @Param("groupStatus") Integer groupStatus,
            @Param("questionStatus") Integer questionStatus,
            @Param("answerStatus") Integer answerStatus
    );

    // Lấy 1 group cụ thể + câu hỏi + đáp án
    @Query("""
        SELECT DISTINCT g FROM QuestionGroupEntity g
        LEFT JOIN FETCH g.questions q
        LEFT JOIN FETCH q.answers a
        WHERE g.id = :groupId
          AND g.status = :groupStatus
          AND q.status = :questionStatus
          AND a.status = :answerStatus
    """)
    Optional<QuestionGroupEntity> findDetailByIdWithQuestionsAndAnswers(
            @Param("groupId") UUID groupId,
            @Param("groupStatus") Integer groupStatus,
            @Param("questionStatus") Integer questionStatus,
            @Param("answerStatus") Integer answerStatus
    );

    // Lấy group + question + answer + file (full join)
    @Query("""
        SELECT DISTINCT g FROM QuestionGroupEntity g
        LEFT JOIN FETCH g.questions q
        LEFT JOIN FETCH q.answers a
        LEFT JOIN FETCH g.files f
        WHERE g.id = :groupId
          AND g.status = :groupStatus
          AND q.status = :questionStatus
          AND a.status = :answerStatus
          AND f.status = :fileStatus
    """)
    Optional<QuestionGroupEntity> findFullDetailById(
            @Param("groupId") UUID groupId,
            @Param("groupStatus") Integer groupStatus,
            @Param("questionStatus") Integer questionStatus,
            @Param("answerStatus") Integer answerStatus,
            @Param("fileStatus") Integer fileStatus
    );

    // Lọc theo ToeicPart + status
    @Query("""
        SELECT DISTINCT g FROM QuestionGroupEntity g
        LEFT JOIN FETCH g.questions q
        LEFT JOIN FETCH q.answers a
        WHERE g.questionPart = :toeicPart
          AND g.status = :groupStatus
          AND q.status = :questionStatus
          AND a.status = :answerStatus
    """)
    List<QuestionGroupEntity> findByToeicPartWithQuestionsAndAnswers(
            @Param("toeicPart") ToeicPart toeicPart,
            @Param("groupStatus") Integer groupStatus,
            @Param("questionStatus") Integer questionStatus,
            @Param("answerStatus") Integer answerStatus
    );
}