package com.defty.question_bank_service.repository;

import com.defty.question_bank_service.dto.response.client.QuestionGroupWithOrderDTO;
import com.defty.question_bank_service.entity.*;
import com.defty.question_bank_service.enums.ToeicPart;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ITestQuestionGroupRepository extends JpaRepository<TestQuestionGroupEntity, UUID> {

    /* ========================================================
       Lấy FULL dữ liệu của tất cả group thuộc một TestSet
       ======================================================== */
    @Query(value = """
    SELECT DISTINCT g.* 
    FROM question_group g
    LEFT JOIN test_question_group tqg 
        ON g.id = tqg.question_group_id AND tqg.status = 1
    LEFT JOIN test_set ts 
        ON tqg.test_set_id = ts.id AND ts.status = 1
    LEFT JOIN question q 
        ON g.id = q.question_group_id AND q.status = 1
    LEFT JOIN question_tag_mapping qtm 
        ON q.id = qtm.question_id AND qtm.status = 1
    LEFT JOIN question_tag qt 
        ON qtm.tag_id = qt.id AND qt.status = 1
    WHERE g.status = 1
      AND (:testSetId IS NULL OR ts.id = :testSetId)
      AND (:questionPart IS NULL OR g.question_part = :questionPart)
      AND (:difficulty IS NULL OR g.difficulty = :difficulty)
      AND (:filterByTags = false OR qt.id = ANY(:tagIds))
    """,
            countQuery = """
    SELECT COUNT(DISTINCT g.id)
    FROM question_group g
    LEFT JOIN test_question_group tqg 
        ON g.id = tqg.question_group_id AND tqg.status = 1
    LEFT JOIN test_set ts 
        ON tqg.test_set_id = ts.id AND ts.status = 1
    LEFT JOIN question q 
        ON g.id = q.question_group_id AND q.status = 1
    LEFT JOIN question_tag_mapping qtm 
        ON q.id = qtm.question_id AND qtm.status = 1
    LEFT JOIN question_tag qt 
        ON qtm.tag_id = qt.id AND qt.status = 1
    WHERE g.status = 1
      AND (:testSetId IS NULL OR ts.id = :testSetId)
      AND (:questionPart IS NULL OR g.question_part = :questionPart)
      AND (:difficulty IS NULL OR g.difficulty = :difficulty)
      AND (:filterByTags = false OR qt.id = ANY(:tagIds))
    """,
            nativeQuery = true)
    Page<QuestionGroupEntity> searchActiveByTestSetId(
            @Param("testSetId") UUID testSetId,
            @Param("questionPart") String questionPart,
            @Param("difficulty") String difficulty,
            @Param("filterByTags") boolean filterByTags,
            @Param("tagIds") UUID[] tagIds,
            Pageable pageable
    );
    @EntityGraph(attributePaths = {
            "questions",
            "questions.answers"
    })
    @Query("SELECT DISTINCT g FROM QuestionGroupEntity g WHERE g.id IN :groupIds")
    List<QuestionGroupEntity> findAllWithQuestionsByIds(@Param("groupIds") List<UUID> groupIds);

    @Modifying
    @Transactional
    @Query("DELETE FROM TestQuestionGroupEntity tqg WHERE tqg.testSet.id = :testSetId AND tqg.questionGroup.id IN :questionGroupIds")
    void deleteByTestSetIdAndQuestionGroupIds(@Param("testSetId") UUID testSetId,
                                              @Param("questionGroupIds") List<UUID> questionGroupIds);

    /* ========================================================
       Lấy FULL dữ liệu theo MỘT ToeicPart cụ thể
       ======================================================== */
    @Query("""
        SELECT DISTINCT g FROM TestQuestionGroupEntity tqg
        JOIN tqg.questionGroup g
        LEFT JOIN FETCH g.files f
        LEFT JOIN FETCH g.questions q
        LEFT JOIN FETCH q.answers a
        WHERE tqg.testSet.id = :testSetId
          AND g.questionPart = :toeicPart
          AND g.status = :groupStatus
          AND q.status = :questionStatus
          AND a.status = :answerStatus
          AND f.status = :fileStatus
        ORDER BY tqg.questionPartOrder, q.questionNumber, a.answerOrder
    """)
    List<QuestionGroupEntity> findFullDetailGroupsByTestSetIdAndPart(
            @Param("testSetId") UUID testSetId,
            @Param("toeicPart") ToeicPart toeicPart,
            @Param("groupStatus") Integer groupStatus,
            @Param("questionStatus") Integer questionStatus,
            @Param("answerStatus") Integer answerStatus,
            @Param("fileStatus") Integer fileStatus
    );

    /* ========================================================
       Lấy FULL dữ liệu theo NHIỀU ToeicPart (Listening / Reading)
       ======================================================== */
//    @Query("""
//    SELECT qg
//    FROM TestQuestionGroupEntity tqg
//    JOIN tqg.questionGroup qg
//    LEFT JOIN FETCH qg.questions q
//    LEFT JOIN FETCH q.answers a
//    LEFT JOIN FETCH qg.files f
//    WHERE tqg.testSet.id = :testSetId
//      AND qg.questionPart IN :parts
//      AND qg.status = :groupStatus
//      AND q.status = :questionStatus
//      AND a.status = :answerStatus
//      AND f.status = :fileStatus
//    ORDER BY tqg.questionPartOrder, q.questionNumber, a.answerOrder, f.displayOrder
//""")
//    List<QuestionGroupEntity> findFullDetailGroupsByTestSetIdAndParts(
//            @Param("testSetId") UUID testSetId,
//            @Param("parts") List<ToeicPart> parts,
//            @Param("groupStatus") Integer groupStatus,
//            @Param("questionStatus") Integer questionStatus,
//            @Param("answerStatus") Integer answerStatus,
//            @Param("fileStatus") Integer fileStatus
//    );

    @Query("""
    SELECT qg
    FROM TestQuestionGroupEntity tqg
    JOIN tqg.questionGroup qg
    LEFT JOIN FETCH qg.questions q
    LEFT JOIN FETCH q.answers a
    LEFT JOIN FETCH qg.files f
    WHERE tqg.testSet.id = :testSetId
      AND (:parts IS NULL OR qg.questionPart IN :parts)
    ORDER BY tqg.questionPartOrder, q.questionNumber, a.answerOrder, f.displayOrder
""")
    List<QuestionGroupEntity> findFullDetailGroupsByTestSetIdAndParts(
            @Param("testSetId") UUID testSetId,
            @Param("parts") List<ToeicPart> parts
    );

    // Query 1: Lấy metadata cho màn overview (SIÊU NHANH)
    @Query("""
    SELECT qg.questionPart, COUNT(q.id)
    FROM TestQuestionGroupEntity tqg
    JOIN tqg.questionGroup qg
    JOIN qg.questions q
    WHERE tqg.testSet.id = :testSetId
      AND q.status = 1
    GROUP BY qg.questionPart
""")
    List<Object[]> countQuestionsByPart(@Param("testSetId") UUID testSetId);

    // Query 2: Lấy question groups (KHÔNG join questions/answers)
    @Query("""
    SELECT qg
    FROM TestQuestionGroupEntity tqg
    JOIN tqg.questionGroup qg
    WHERE tqg.testSet.id = :testSetId
      AND (:parts IS NULL OR qg.questionPart IN :parts)
      AND qg.status = 1
    ORDER BY qg.questionPart ASC, qg.questionGroupOrder ASC
""")
    List<QuestionGroupEntity> findGroupsByTestSetAndParts(
            @Param("testSetId") UUID testSetId,
            @Param("parts") List<ToeicPart> parts
    );

    @Query("""
SELECT new com.defty.question_bank_service.dto.response.client.QuestionGroupWithOrderDTO(
    qg, tqg.questionPartOrder
)
FROM TestQuestionGroupEntity tqg
JOIN tqg.questionGroup qg
WHERE tqg.testSet.id = :testSetId
  AND (:parts IS NULL OR qg.questionPart IN :parts)
  AND qg.status = 1
ORDER BY qg.questionPart ASC, tqg.questionPartOrder ASC
""")
    List<QuestionGroupWithOrderDTO> findGroupsWithPartOrderByTestSetAndParts(
            @Param("testSetId") UUID testSetId,
            @Param("parts") List<ToeicPart> parts
    );


    // Query 3: Lấy questions theo groupIds
    @Query("""
    SELECT q
    FROM QuestionEntity q
    WHERE q.questionGroup.id IN :groupIds
      AND q.status = 1
    ORDER BY q.questionNumber ASC
""")
    List<QuestionEntity> findQuestionsByGroupIds(@Param("groupIds") List<UUID> groupIds);

    // Query 4: Lấy answers theo questionIds
    @Query("""
    SELECT a
    FROM AnswerEntity a
    WHERE a.question.id IN :questionIds
      AND a.status = 1
    ORDER BY a.answerOrder ASC
""")
    List<AnswerEntity> findAnswersByQuestionIds(@Param("questionIds") List<UUID> questionIds);

    // Query 5: Lấy files theo groupIds
    @Query("""
    SELECT f
    FROM FileEntity f
    WHERE f.questionGroup.id IN :groupIds
      AND f.status = 1
    ORDER BY f.displayOrder ASC
""")
    List<FileEntity> findFilesByGroupIds(@Param("groupIds") List<UUID> groupIds);


    /* ========================================================
       CRUD cơ bản với bảng trung gian
       ======================================================== */
    List<TestQuestionGroupEntity> findByTestSetId(UUID testSetId);

    long countByTestSetId(UUID testSetId);

    void deleteByTestSetId(UUID testSetId);
}