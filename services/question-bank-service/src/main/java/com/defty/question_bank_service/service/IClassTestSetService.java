package com.defty.question_bank_service.service;

import com.defty.question_bank_service.dto.request.AssignTestSetsRequest;
import com.defty.question_bank_service.dto.request.UpdateAssignmentRequest;
import com.defty.question_bank_service.dto.response.ClassTestSetResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface IClassTestSetService {

    // Gán bài test cho nhiều lớp
    List<Long> assignTestSetsToClasses(AssignTestSetsRequest request, Long teacherId);

    // Lấy danh sách bài test của một lớp (có phân trang)
    Page<ClassTestSetResponse> getTestSetsByClassId(Long classId, Pageable pageable);

    // Lấy danh sách bài test của một lớp (không phân trang)
    List<ClassTestSetResponse> getAllTestSetsByClassId(Long classId);

    // Lấy chi tiết một assignment
    ClassTestSetResponse getAssignmentById(Long assignmentId);

    // Cập nhật thông tin assignment (thời gian, trạng thái)
    Long updateAssignment(Long assignmentId, UpdateAssignmentRequest request);

    // Gỡ bài test khỏi lớp (soft delete)
    void removeTestSetFromClass(Long classId, UUID testSetId);

    // Gỡ nhiều bài test khỏi lớp
    void removeTestSetsFromClass(Long classId, List<UUID> testSetIds);

    // Xóa vĩnh viễn assignment
    void deleteAssignment(Long assignmentId);

    // Lấy tất cả lớp được gán một test set
    List<ClassTestSetResponse> getClassesByTestSetId(UUID testSetId);

    // Lấy các bài test đang active của lớp
    List<ClassTestSetResponse> getActiveTestSetsByClassId(Long classId);
}