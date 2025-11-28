package com.defty.question_bank_service.repository;

import com.defty.question_bank_service.dto.response.projection.TestSetStatsProjection;
import com.defty.question_bank_service.dto.response.projection.TestSetSummary;
import com.defty.question_bank_service.entity.TestSetEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ITestSetRepository extends JpaRepository<TestSetEntity, UUID> {
    // For getTestSetById()
    @Query("SELECT ts FROM TestSetEntity ts LEFT JOIN FETCH ts.collection WHERE ts.id = :id AND ts.status != :status")
    Optional<TestSetEntity> findByIdAndStatusNotWithCollection(@Param("id") UUID id, @Param("status") Integer status);
    Optional<TestSetEntity> findBySlugAndStatusNot(String slug, Integer status);

    // For getAllActiveSets()
    @Query("SELECT ts FROM TestSetEntity ts LEFT JOIN FETCH ts.collection WHERE ts.status = :status ORDER BY ts.testName ASC")
    List<TestSetEntity> findByStatusOrderByTestNameAscWithCollection(@Param("status") Integer status);

    // For getTestSetsByCollection()
    @Query("SELECT ts FROM TestSetEntity ts LEFT JOIN FETCH ts.collection WHERE ts.collection.id = :collectionId AND ts.status = :status ORDER BY ts.testNumber ASC")
    List<TestSetEntity> findByCollectionIdAndStatusOrderByTestNumberAscWithCollection(@Param("collectionId") UUID collectionId, @Param("status") Integer status);

    boolean existsByTestNameAndCollectionIdAndStatus(String testName, UUID collectionId, Integer status);

    boolean existsByTestNameAndCollectionIdAndStatusAndIdNot(String testName, UUID collectionId, Integer status, UUID id);
    boolean existsByTestNameAndStatusAndIdNot(String testName, Integer status, UUID id);
    boolean existsByTestNameAndStatusNot(String testName, Integer status);
    boolean existsBySlugAndStatus(String slug, Integer status);
    boolean existsBySlug(String slug);
    boolean existsBySlugAndIdNot(String slug, UUID id);
    boolean existsByIdAndStatusNot(UUID id, Integer status);

    boolean existsBySlugAndStatusAndIdNot(String slug, Integer status, UUID id);

    boolean existsByTestNumberAndCollectionIdAndStatus(Integer testNumber, UUID collectionId, Integer status);

    boolean existsByTestNumberAndCollectionIdAndStatusAndIdNot(Integer testNumber, UUID collectionId, Integer status, UUID id);

    Optional<TestSetEntity> findByIdAndStatusNot(UUID id, Integer status);

    Optional<TestSetEntity> findByIdAndStatus(UUID id, Integer status);

    List<TestSetEntity> findByStatusOrderByTestNameAsc(Integer status);

    List<TestSetEntity> findByCollectionIdAndStatusOrderByTestNumberAsc(UUID collectionId, Integer status);

    List<TestSetEntity> findAllByIdInAndStatusNot(List<UUID> ids, Integer status);
    long countByCollectionIdAndStatusNot(UUID collectionId, Integer status);
    @Query("""
    SELECT 
        ts.id AS id,
        ts.testName AS testName,
        ts.slug AS slug,
        ts.testNumber AS testNumber,
        ts.description AS description,
        c.id AS collectionId,
        c.collectionName AS collectionName,
        ts.status AS status,
        ts.isPublic AS isPublic,
        ts.createdDate AS createdDate,
        ts.modifiedDate AS modifiedDate,
        ts.createdBy AS createdBy,
        ts.modifiedBy AS modifiedBy,
        COUNT(q.id) AS totalQuestions
    FROM TestSetEntity ts
    LEFT JOIN ts.collection c
    LEFT JOIN TestQuestionGroupEntity tqg ON tqg.testSet.id = ts.id
    LEFT JOIN QuestionEntity q ON q.questionGroup.id = tqg.questionGroup.id
    WHERE (:testName IS NULL OR LOWER(ts.testName) LIKE LOWER(CONCAT('%', :testName, '%')))
      AND (:slug IS NULL OR LOWER(ts.slug) LIKE LOWER(CONCAT('%', :slug, '%')))
      AND (:collectionId IS NULL OR ts.collection.id = :collectionId)
      AND (:status IS NULL OR ts.status = :status)
      AND ts.status != -1
    GROUP BY ts.id, c.id, c.collectionName, ts.testName, ts.slug, ts.testNumber, ts.description,
             ts.status, ts.createdDate, ts.modifiedDate, ts.createdBy, ts.modifiedBy
    ORDER BY ts.createdDate DESC
""")
    Page<TestSetSummary> findTestSetSummaries(
            @Param("testName") String testName,
            @Param("slug") String slug,
            @Param("collectionId") UUID collectionId,
            @Param("status") Integer status,
            Pageable pageable);

    @Query("""
        SELECT 
            ts.testSet.id AS testSetId,
            ts.attemptCount AS attemptCount,
            ts.commentCount AS commentCount
        FROM TestSetStatsEntity ts
        WHERE ts.testSet.id IN :testSetIds
    """)
    List<TestSetStatsProjection> findStatsByTestSetIds(@Param("testSetIds") List<UUID> testSetIds);


    @Query("""
       SELECT ts 
       FROM TestSetEntity ts
       LEFT JOIN FETCH ts.collection c
       WHERE (:testName IS NULL OR ts.testName ILIKE CONCAT('%', :testName, '%')) 
         AND (:slug IS NULL OR ts.slug ILIKE CONCAT('%', :slug, '%')) 
         AND (:collectionId IS NULL OR ts.collection.id = :collectionId)
         AND (:status IS NULL OR ts.status = :status)
         AND (ts.status != -1) 
       ORDER BY ts.createdDate DESC
       """)
    Page<TestSetEntity> findTestSets(
            @Param("testName") String testName,
            @Param("slug") String slug,
            @Param("collectionId") UUID collectionId,
            @Param("status") Integer status,
            Pageable pageable
    );

    @Query("SELECT ts, COUNT(tqg) as questionGroupCount FROM TestSetEntity ts " +
            "LEFT JOIN ts.testQuestionGroups tqg " +
            "WHERE ts.id = :id " +
            "GROUP BY ts")
    Object[] findTestSetWithCount(@Param("id") UUID id);

    @Query("SELECT MAX(ts.testNumber) FROM TestSetEntity ts WHERE ts.collection.id = :collectionId AND ts.status != -1")
    Integer findMaxTestNumberByCollectionId(@Param("collectionId") UUID collectionId);

    @Query("""
        SELECT t.id
        FROM TestSetEntity t
        WHERE t.isPublic = TRUE
          AND t.status <> -1
          AND (:testName IS NULL OR :testName = '' OR LOWER(t.testName) LIKE LOWER(CONCAT('%', :testName, '%')))
          AND (:collectionId IS NULL OR t.collection.id = :collectionId)
    """)
    Page<UUID> findPublicTestSetIds(
            @Param("testName") String testName,
            @Param("collectionId") UUID collectionId,
            Pageable pageable
    );

    @Query("""
        SELECT DISTINCT t
        FROM TestSetEntity t
        LEFT JOIN FETCH t.collection c
        LEFT JOIN FETCH t.stats s
        WHERE t.id IN :ids
    """)
    List<TestSetEntity> findByIdsWithDetails(@Param("ids") List<UUID> ids);
}