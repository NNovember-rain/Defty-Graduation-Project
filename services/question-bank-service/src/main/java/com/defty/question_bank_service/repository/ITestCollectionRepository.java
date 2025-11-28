package com.defty.question_bank_service.repository;

import com.defty.question_bank_service.entity.TestCollectionEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ITestCollectionRepository extends JpaRepository<TestCollectionEntity, UUID> {

    boolean existsByCollectionNameAndStatus(String collectionName, Integer status);

    boolean existsByCollectionNameAndStatusAndIdNot(String collectionName, Integer status, UUID id);

    boolean existsBySlugAndStatus(String slug, Integer status);

    boolean existsBySlugAndStatusAndIdNot(String slug, Integer status, UUID id);

    Optional<TestCollectionEntity> findByIdAndStatusNot(UUID id, Integer status);

    Optional<TestCollectionEntity> findByIdAndStatus(UUID id, Integer status);

    List<TestCollectionEntity> findByStatusOrderByCollectionNameAsc(Integer status);

    List<TestCollectionEntity> findAllByIdInAndStatusNot(List<UUID> id, Integer status);

    @Query("""
       SELECT tc 
       FROM TestCollectionEntity tc
       WHERE (:collectionName IS NULL OR tc.collectionName ILIKE CONCAT('%', :collectionName, '%')) 
         AND (:slug IS NULL OR tc.slug ILIKE CONCAT('%', :slug, '%')) 
         AND (:status IS NULL OR tc.status = :status)
         AND (tc.status != -1) 
       ORDER BY tc.createdDate DESC
       """)
    Page<TestCollectionEntity> findTestCollections(
            @Param("collectionName") String collectionName,
            @Param("slug") String slug,
            @Param("status") Integer status,
            Pageable pageable
    );

    @Query("SELECT tc, COUNT(ts) as testSetCount FROM TestCollectionEntity tc " +
            "LEFT JOIN tc.testSets ts " +
            "WHERE tc.id = :id " +
            "GROUP BY tc")
    Object[] findTestCollectionWithCount(@Param("id") UUID id);
    boolean existsBySlug(String slug);
    boolean existsBySlugAndIdNot(String slug, UUID id);
    List<TestCollectionEntity> findByIdInAndStatusNot(List<UUID> ids, Integer Status);

    @Query("""
        SELECT c
        FROM TestCollectionEntity c
        WHERE c.isPublic = TRUE
          AND (:collectionName IS NULL OR LOWER(c.collectionName) LIKE LOWER(CONCAT('%', :collectionName, '%')))
          AND c.status = 1
        ORDER BY c.createdDate DESC
    """)
    Page<TestCollectionEntity> findPublicCollections(
            @Param("collectionName") String collectionName,
            Pageable pageable
    );
}