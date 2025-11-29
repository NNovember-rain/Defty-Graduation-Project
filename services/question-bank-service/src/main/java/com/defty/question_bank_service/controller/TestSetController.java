package com.defty.question_bank_service.controller;
import com.defty.question_bank_service.dto.request.AssignTestSetsRequest;
import com.defty.question_bank_service.dto.request.QuestionGroupOrderRequest;
import com.defty.question_bank_service.dto.request.TestSetRequest;
import com.defty.question_bank_service.dto.request.UpdateAssignmentRequest;
import com.defty.question_bank_service.dto.response.*;
import com.defty.question_bank_service.dto.response.client.TestSetOverviewResponse;
import com.defty.question_bank_service.dto.response.client.TestSetQuestionsResponse;
import com.defty.question_bank_service.enums.Status;
import com.defty.question_bank_service.enums.ToeicPart;
import com.defty.question_bank_service.service.IClassTestSetService;
import com.defty.question_bank_service.service.ITestSetService;
import com.example.common_library.exceptions.AppException;
import com.example.common_library.exceptions.ErrorCode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
//import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@Slf4j
@RequiredArgsConstructor
@RequestMapping("/test-sets")
public class TestSetController {

    private final ITestSetService testSetService;
    private final IClassTestSetService classTestSetService;

    @PostMapping("")
//    @PreAuthorize("hasPermission(null, 'test.set.create')")
    public ApiResponse<UUID> createTestSet(@Valid @RequestBody TestSetRequest request) {
        UUID id = testSetService.createTestSet(request);
        return new ApiResponse<>(201, "Tạo bài test thành công", id);
    }

    @GetMapping("/{id}")
////    @PreAuthorize("hasPermission(null, 'test.set.view')")
    public ApiResponse<TestSetResponse> getTestSetById(@PathVariable UUID id) {
        TestSetResponse response = testSetService.getTestSetById(id);
        return new ApiResponse<>(200, "Lấy thông tin bài test thành công", response);
    }

    @GetMapping("")
////    @PreAuthorize("hasPermission(null, 'test.set.view')")
    public ApiResponse<PageableResponse<TestSetResponse>> getTestSets(
            Pageable pageable,
            @RequestParam(name = "test_name", required = false) String testName,
            @RequestParam(name = "slug", required = false) String slug,
            @RequestParam(name = "collection_id", required = false) UUID collectionId,
            @RequestParam(name = "status", required = false) Integer status) {

        PageableResponse<TestSetResponse> response = testSetService.getTestSets(
                pageable, testName, slug, collectionId, status);
        return new ApiResponse<>(200, "Lấy danh sách bài test thành công", response);
    }

    @GetMapping("/active")
    public ApiResponse<List<TestSetResponse>> getAllActiveSets() {
        List<TestSetResponse> responses = testSetService.getAllActiveSets();
        return new ApiResponse<>(200, "Lấy danh sách bài test hoạt động thành công", responses);
    }

    @GetMapping("/collection/{collectionId}")
    public ApiResponse<List<TestSetResponse>> getTestSetsByCollection(@PathVariable UUID collectionId) {
        List<TestSetResponse> responses = testSetService.getTestSetsByCollection(collectionId);
        return new ApiResponse<>(200, "Lấy danh sách bài test theo bộ sưu tập thành công", responses);
    }

    @PutMapping("/{id}")
//    @PreAuthorize("hasPermission(null, 'test.set.update')")
    public ApiResponse<UUID> updateTestSet(
            @PathVariable UUID id,
            @Valid @RequestBody TestSetRequest request) {
        UUID updatedId = testSetService.updateTestSet(id, request);
        return new ApiResponse<>(200, "Cập nhật bài test thành công", updatedId);
    }

    @DeleteMapping("/{ids}")
//    @PreAuthorize("hasPermission(null, 'test.set.delete')")
    public ApiResponse<List<UUID>> deleteTestSets(@PathVariable List<UUID> ids) {
        List<UUID> deletedIds = testSetService.deleteTestSets(ids);
        return new ApiResponse<>(200, "Xóa bài test thành công", deletedIds);
    }

    @PatchMapping("/toggle-status/{id}")
//    @PreAuthorize("hasPermission(null, 'test.set.toggle.status')")
    public ApiResponse<UUID> toggleActiveStatus(@PathVariable UUID id) {
        UUID toggledId = testSetService.toggleActiveStatus(id);
        return new ApiResponse<>(200, "Thay đổi trạng thái bài test thành công", toggledId);
    }

    // ========== QUESTION GROUP MANAGEMENT ==========

    @PostMapping("/{testSetId}/question-groups")
//    @PreAuthorize("hasPermission(null, 'test.set.update')")
    public ApiResponse<List<UUID>> addQuestionGroups(
            @PathVariable UUID testSetId,
            @RequestBody List<QuestionGroupOrderRequest> requests) {
        List<UUID> responses = testSetService.addQuestionGroups(testSetId, requests);
        return new ApiResponse<>(201, "Thêm câu hỏi vào bài test thành công", responses);
    }

    @PatchMapping("/{testSetId}/question-groups")
//    @PreAuthorize("hasPermission(null, 'test.set.update')")
    public ApiResponse<List<UUID>> updateQuestionGroupOrders(
            @PathVariable UUID testSetId,
            @RequestBody List<QuestionGroupOrderRequest> requests) {
        List<UUID> responses = testSetService.updateQuestionGroupOrders(testSetId, requests);
        return new ApiResponse<>(201, "Cập nhật thứ tự thành công", responses);
    }

//    //    @PreAuthorize("hasPermission(null, 'test_set.view')")
    @GetMapping("/{testSetId}/question-groups")
    public ApiResponse<Page<QuestionGroupResponse>> getQuestionGroups(
            @PathVariable UUID testSetId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "limit", defaultValue = "10") int limit,
            @RequestParam(value = "tagIds", required = false) List<UUID> tagIds,
            @RequestParam(value = "questionPart", required = false) String questionPart,
            @RequestParam(value = "difficulty", required = false) String difficulty
    ) {
        Page<QuestionGroupResponse> responses = testSetService.getQuestionGroupsByTestSet(
                testSetId, tagIds, questionPart, difficulty, page, limit
        );
        return new ApiResponse<>(200, "Lấy danh sách câu hỏi trong bài test thành công", responses);
    }

    @DeleteMapping("/{testSetId}/question-groups/{ids}")
//    @PreAuthorize("hasPermission(null, 'test.set.update')")
    public ApiResponse<Void> removeQuestionGroups(
            @PathVariable UUID testSetId,
            @PathVariable List<UUID> ids) {
        log.info("Request to delete question groups {} from test set {}", ids, testSetId);
        testSetService.removeQuestionGroups(testSetId, ids);
        return new ApiResponse<>(200, "Xóa nhóm câu hỏi khỏi bài test thành công", null);
    }

    // ========== API GET TESTSET DETAILS FOR TAKING TEST ==========

    @GetMapping("/{id}/detail")
    public ApiResponse<TestSetDetailResponse> getTestSetDetail(
            @PathVariable UUID id,
            @RequestParam(required = false) List<ToeicPart> parts
    ) {
        TestSetDetailResponse response = testSetService.getTestSetDetail(id, parts);
        return new ApiResponse<>(200, "Success", response);
    }

    // ========== MÀN 1: CHI TIẾT ĐỀ THI==========
    @GetMapping("/accessible/{slug}/overview")
    public ApiResponse<TestSetOverviewResponse> getTestSetOverview(@PathVariable String slug) {
        TestSetOverviewResponse response = testSetService.getTestSetOverview(slug);
        return new ApiResponse<>(200, "Success", response);
    }

    // ========== MÀN 2: LÀM BÀI THI ==========
    @GetMapping("/accessible/{slug}/questions")
    public ApiResponse<TestSetQuestionsResponse> getTestSetQuestions(
            @PathVariable String slug,
            @RequestParam(required = false) List<ToeicPart> parts
    ) {
        TestSetQuestionsResponse response = testSetService.getTestSetQuestions(slug, parts);
        return new ApiResponse<>(200, "Success", response);
    }

    @GetMapping("/accessible/{testSetId}/question-groups/orders")
    public ApiResponse<List<TestSetQuestionOrderResponse>> getQuestionGroupOrders(
            @PathVariable UUID testSetId
    ) {
        List<TestSetQuestionOrderResponse> responses = testSetService.getQuestionGroupOrders(testSetId);
        return new ApiResponse<>(200, "Lấy danh sách ID và thứ tự nhóm câu hỏi trong bài test thành công", responses);
    }

    @PatchMapping("/toggle-public/{id}")
//    @PreAuthorize("hasPermission(null, 'test.set.update')")
    public ApiResponse<UUID> togglePublicStatus(@PathVariable UUID id) {
        UUID toggledId = testSetService.togglePublicStatus(id);
        return new ApiResponse<>(200, "Thay đổi trạng thái công khai thành công", toggledId);
    }

    @GetMapping("/accessible")
    public ApiResponse<PageableResponse<TestSetResponse>> getPublicTestSets(
            Pageable pageable,
            @RequestParam(name = "test_name", required = false) String testName,
            @RequestParam(name = "collection_id", required = false) UUID collectionId
    ) {
        PageableResponse<TestSetResponse> response = testSetService.getPublicTestSets(pageable, testName, collectionId);
        return new ApiResponse<>(200, "Lấy danh sách bài test công khai thành công", response);
    }

    /**
     * Gán nhiều bài test cho nhiều lớp
     */
    @PostMapping("/assign-to-classes")
    public ApiResponse<List<Long>> assignTestSetsToClasses(
            @Valid @RequestBody AssignTestSetsRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long teacherId) {
        teacherId = 1L;
        if (teacherId == null) {
            throw new AppException(ErrorCode.FORBIDDEN, "Teacher ID is required");
        }

        List<Long> assignmentIds = classTestSetService.assignTestSetsToClasses(request, teacherId);
        return new ApiResponse<>(201, "Gán bài test cho lớp thành công", assignmentIds);
    }

    /**
     * Lấy danh sách bài test của một lớp (có phân trang)
     */
    @GetMapping("/by-class/{classId}")
    public ApiResponse<Page<ClassTestSetResponse>> getTestSetsByClass(
            @PathVariable Long classId,
            Pageable pageable) {

        Page<ClassTestSetResponse> response = classTestSetService.getTestSetsByClassId(classId, pageable);
        return new ApiResponse<>(200, "Lấy danh sách bài test của lớp thành công", response);
    }

    /**
     * Lấy tất cả bài test của lớp (không phân trang)
     */
    @GetMapping("/by-class/{classId}/all")
    public ApiResponse<List<ClassTestSetResponse>> getAllTestSetsByClass(@PathVariable Long classId) {
        List<ClassTestSetResponse> response = classTestSetService.getAllTestSetsByClassId(classId);
        return new ApiResponse<>(200, "Lấy tất cả bài test của lớp thành công", response);
    }

    /**
     * Lấy các bài test đang active của lớp
     */
    @GetMapping("/by-class/{classId}/active")
    public ApiResponse<List<ClassTestSetResponse>> getActiveTestSetsByClass(@PathVariable Long classId) {
        List<ClassTestSetResponse> response = classTestSetService.getActiveTestSetsByClassId(classId);
        return new ApiResponse<>(200, "Lấy bài test đang hoạt động thành công", response);
    }

    /**
     * Lấy chi tiết một assignment
     */
    @GetMapping("/assignments/{assignmentId}")
    public ApiResponse<ClassTestSetResponse> getAssignmentById(@PathVariable Long assignmentId) {
        ClassTestSetResponse response = classTestSetService.getAssignmentById(assignmentId);
        return new ApiResponse<>(200, "Lấy thông tin assignment thành công", response);
    }

    /**
     * Cập nhật assignment (thời gian, trạng thái)
     */
    @PatchMapping("/assignments/{assignmentId}")
    public ApiResponse<Long> updateAssignment(
            @PathVariable Long assignmentId,
            @Valid @RequestBody UpdateAssignmentRequest request) {

        Long updatedId = classTestSetService.updateAssignment(assignmentId, request);
        return new ApiResponse<>(200, "Cập nhật assignment thành công", updatedId);
    }

    /**
     * Gỡ một bài test khỏi lớp (soft delete)
     */
    @DeleteMapping("/by-class/{classId}/test-set/{testSetId}")
    public ApiResponse<Void> removeTestSetFromClass(
            @PathVariable Long classId,
            @PathVariable UUID testSetId) {

        classTestSetService.removeTestSetFromClass(classId, testSetId);
        return new ApiResponse<>(200, "Gỡ bài test khỏi lớp thành công", null);
    }

    /**
     * Gỡ nhiều bài test khỏi lớp
     */
    @DeleteMapping("/by-class/{classId}/test-sets")
    public ApiResponse<Void> removeTestSetsFromClass(
            @PathVariable Long classId,
            @RequestBody List<UUID> testSetIds) {

        classTestSetService.removeTestSetsFromClass(classId, testSetIds);
        return new ApiResponse<>(200, "Gỡ các bài test khỏi lớp thành công", null);
    }

    /**
     * Xóa vĩnh viễn một assignment
     */
    @DeleteMapping("/assignments/{assignmentId}")
    public ApiResponse<Void> deleteAssignment(@PathVariable Long assignmentId) {
        classTestSetService.deleteAssignment(assignmentId);
        return new ApiResponse<>(200, "Xóa assignment thành công", null);
    }

    /**
     * Lấy danh sách lớp được gán một bài test cụ thể
     */
    @GetMapping("/{testSetId}/classes")
    public ApiResponse<List<ClassTestSetResponse>> getClassesByTestSet(@PathVariable UUID testSetId) {
        List<ClassTestSetResponse> response = classTestSetService.getClassesByTestSetId(testSetId);
        return new ApiResponse<>(200, "Lấy danh sách lớp được gán bài test thành công", response);
    }
}