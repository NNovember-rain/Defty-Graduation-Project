package com.defty.question_bank_service.repository;

import com.defty.question_bank_service.entity.FileEntity;
import com.defty.question_bank_service.enums.FileType;
import com.defty.question_bank_service.entity.QuestionGroupEntity;
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
public interface IFileRepository extends JpaRepository<FileEntity, UUID> {

    /* =========================
       BASIC FINDERS WITH STATUS
       ========================= */

    Optional<FileEntity> findByIdAndStatus(UUID id, Integer status);

    List<FileEntity> findByStatus(Integer status);

    @Query(value = """
        SELECT f FROM FileEntity f
        WHERE (:groupId IS NULL OR f.questionGroup.id = :groupId)
          AND f.status <> :deletedStatus
          AND (:status IS NULL OR f.status = :status)
    """,
            countQuery = """
        SELECT COUNT(f) FROM FileEntity f
        WHERE (:groupId IS NULL OR f.questionGroup.id = :groupId)
          AND f.status <> :deletedStatus
          AND (:status IS NULL OR f.status = :status)
    """)
    Page<FileEntity> findWithFilters(@Param("groupId") UUID groupId,
                                     @Param("deletedStatus") Integer deletedStatus,
                                     @Param("status") Integer status,
                                     Pageable pageable);

    /* =========================
       URL BASED
       ========================= */

    Optional<FileEntity> findByUrlAndStatus(String url, Integer status);

    /* =========================
       QUESTION GROUP BASED
       ========================= */

    List<FileEntity> findByQuestionGroupAndStatus(QuestionGroupEntity questionGroup, Integer status);

    List<FileEntity> findByQuestionGroupIdAndStatus(UUID questionGroupId, Integer status);

    List<FileEntity> findByQuestionGroupAndTypeAndStatus(QuestionGroupEntity questionGroup, FileType type, Integer status);

    /* =========================
       DELETE OPERATIONS
       ========================= */

    void deleteById(UUID id); // hard delete

    void deleteByQuestionGroupId(UUID questionGroupId); // hard delete

    /* =========================
       COUNT OPERATIONS
       ========================= */

    long countByQuestionGroupIdAndStatus(UUID questionGroupId, Integer status);

    long countByStatus(Integer status);

    @Modifying
    @Query("UPDATE FileEntity f SET f.status = :status WHERE f.id IN :ids")
    void batchUpdateStatus(@Param("ids") List<UUID> ids, @Param("status") Integer status);
}