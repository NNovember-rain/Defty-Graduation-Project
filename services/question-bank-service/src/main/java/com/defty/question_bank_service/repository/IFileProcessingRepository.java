package com.defty.question_bank_service.repository;

import com.defty.question_bank_service.entity.FileProcessingEntity;
import com.defty.question_bank_service.enums.PartType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IFileProcessingRepository extends JpaRepository<FileProcessingEntity, UUID> {
    @Query("SELECT fp FROM FileProcessingEntity fp " +
            "LEFT JOIN FETCH fp.testSet " +
            "WHERE fp.id = :id")
    Optional<FileProcessingEntity> findByIdWithTestSet(@Param("id") UUID id);

    List<FileProcessingEntity> findByTestSetIdOrderByCreatedDateDesc(UUID testSetId);

    @Query("SELECT fp FROM FileProcessingEntity fp " +
            "LEFT JOIN FETCH fp.testSet ts " +
            "WHERE (:testSetId IS NULL OR fp.testSet.id = :testSetId) " +
            "AND (:partType IS NULL OR fp.partType = :partType) " +
            "AND (fp.status != -1) " +
            "AND (:status IS NULL OR fp.status = :status)")
    Page<FileProcessingEntity> findFileProcessings(
            @Param("testSetId") UUID testSetId,
            @Param("partType") PartType partType,
            @Param("status") Integer status,
            Pageable pageable
    );

    /**
     * Đếm số file đang xử lý của một test set (để hiển thị badge/indicator)
     */
//    @Query("SELECT COUNT(fp) FROM FileProcessingEntity fp " +
//            "WHERE fp.testSet.id = :testSetId " +
//            "AND fp.currentStep NOT IN ('DONE', 'FAILED')")
//    long countProcessingByTestSetId(@Param("testSetId") UUID testSetId);

    /**
     * Tìm các file processing lỗi chưa được resolve (Giai đoạn 4 - xử lý lỗi)
     */
//    @Query("SELECT fp FROM FileProcessingEntity fp " +
//            "WHERE fp.currentStep = 'FAILED' " +
//            "AND fp.manuallyResolved = false " +
//            "ORDER BY fp.createdDate DESC")
//    List<FileProcessingEntity> findUnresolvedErrors();

    /**
     * Tìm các file đang trong trạng thái pending/processing quá lâu (timeout detection)
     * Hỗ trợ Giai đoạn 3 - phát hiện timeout
     */
//    @Query("SELECT fp FROM FileProcessingEntity fp " +
//            "WHERE fp.currentStep IN ('UPLOADED', 'AI_PROCESSING', 'RETRY') " +
//            "AND fp.startedAt < :timeoutThreshold " +
//            "AND fp.completedAt IS NULL")
//    List<FileProcessingEntity> findTimedOutProcessings(
//            @Param("timeoutThreshold") java.time.LocalDateTime timeoutThreshold
//    );

    /**
     * Tìm file processing theo test set và part type (kiểm tra đã có file nào đang xử lý chưa)
     */
//    @Query("SELECT fp FROM FileProcessingEntity fp " +
//            "WHERE fp.testSet.id = :testSetId " +
//            "AND fp.partType = :partType " +
//            "AND fp.currentStep NOT IN ('DONE', 'FAILED') " +
//            "ORDER BY fp.createdDate DESC")
//    List<FileProcessingEntity> findActiveProcessingsByTestSetAndPart(
//            @Param("testSetId") UUID testSetId,
//            @Param("partType") PartType partType
//    );

    /**
     * Thống kê số lượng file theo trạng thái (cho dashboard)
     */
//    @Query("SELECT fp.currentStep, COUNT(fp) FROM FileProcessingEntity fp " +
//            "WHERE fp.testSet.id = :testSetId " +
//            "GROUP BY fp.currentStep")
//    List<Object[]> countByStatusForTestSet(@Param("testSetId") UUID testSetId);
}