package com.defty.question_bank_service.repository;

import com.defty.question_bank_service.entity.ClassTestSetEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IClassTestSetRepository extends JpaRepository<ClassTestSetEntity, Long> {

    // Tìm tất cả test sets của một lớp (có phân trang)
    @Query("SELECT ct FROM ClassTestSetEntity ct " +
            "JOIN FETCH ct.testSet ts " +
            "LEFT JOIN FETCH ts.collection " +
            "WHERE ct.classId = :classId AND ct.status != -1")
    Page<ClassTestSetEntity> findByClassIdWithDetails(@Param("classId") Long classId, Pageable pageable);

    // Tìm tất cả test sets của một lớp (không phân trang)
    @Query("SELECT ct FROM ClassTestSetEntity ct " +
            "JOIN FETCH ct.testSet ts " +
            "LEFT JOIN FETCH ts.collection " +
            "WHERE ct.classId = :classId AND ct.status != -1")
    List<ClassTestSetEntity> findByClassId(@Param("classId") Long classId);

    // Tìm tất cả lớp được gán một test set cụ thể
    @Query("SELECT ct FROM ClassTestSetEntity ct " +
            "JOIN FETCH ct.testSet ts " +
            "WHERE ts.id = :testSetId AND ct.status != -1")
    List<ClassTestSetEntity> findByTestSetId(@Param("testSetId") UUID testSetId);

    // Kiểm tra test set đã được gán cho lớp chưa
    boolean existsByClassIdAndTestSet_IdAndStatusNot(Long classId, UUID testSetId, Integer status);

    // Tìm assignment cụ thể
    @Query("SELECT ct FROM ClassTestSetEntity ct " +
            "JOIN FETCH ct.testSet ts " +
            "LEFT JOIN FETCH ts.collection " +
            "WHERE ct.classId = :classId AND ts.id = :testSetId AND ct.status != -1")
    Optional<ClassTestSetEntity> findByClassIdAndTestSetId(
            @Param("classId") Long classId,
            @Param("testSetId") UUID testSetId);

    // Tìm các bài test đang active của lớp
    @Query("SELECT ct FROM ClassTestSetEntity ct " +
            "JOIN FETCH ct.testSet ts " +
            "LEFT JOIN FETCH ts.collection " +
            "WHERE ct.classId = :classId " +
            "AND ct.isActive = true AND ct.status = 1 AND ts.status = 1")
    List<ClassTestSetEntity> findActiveTestSetsByClassId(@Param("classId") Long classId);

    // Tìm các bài test trong khoảng thời gian
    @Query("SELECT ct FROM ClassTestSetEntity ct " +
            "JOIN FETCH ct.testSet ts " +
            "WHERE ct.classId = :classId " +
            "AND ct.startDate <= :now AND ct.endDate >= :now " +
            "AND ct.isActive = true AND ct.status = 1")
    List<ClassTestSetEntity> findAvailableTestSets(
            @Param("classId") Long classId,
            @Param("now") LocalDateTime now);

    // Soft delete theo classId và testSetId
    @Modifying
    @Query("UPDATE ClassTestSetEntity ct SET ct.isActive = false " +
            "WHERE ct.classId = :classId AND ct.testSet.id = :testSetId")
    void softDeleteByClassIdAndTestSetId(
            @Param("classId") Long classId,
            @Param("testSetId") UUID testSetId);

    // Soft delete nhiều
    @Modifying
    @Query("UPDATE ClassTestSetEntity ct SET ct.isActive = false " +
            "WHERE ct.classId = :classId AND ct.testSet.id IN :testSetIds")
    void softDeleteByClassIdAndTestSetIds(
            @Param("classId") Long classId,
            @Param("testSetIds") List<UUID> testSetIds);
}