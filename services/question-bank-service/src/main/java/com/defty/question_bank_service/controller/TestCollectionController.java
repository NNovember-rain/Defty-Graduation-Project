package com.defty.question_bank_service.controller;
import com.defty.question_bank_service.dto.request.TestCollectionRequest;
import com.defty.question_bank_service.dto.response.TestCollectionResponse;
import com.defty.question_bank_service.service.ITestCollectionService;
import com.defty.question_bank_service.dto.response.ApiResponse;
import com.defty.question_bank_service.dto.response.PageableResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
//import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@Slf4j
@RequiredArgsConstructor
@RequestMapping("/test-collections")
public class TestCollectionController {

    private final ITestCollectionService testCollectionService;

    @PostMapping("")
//    @PreAuthorize("hasPermission(null, 'test.collection.create')")
    public ApiResponse<UUID> createTestCollection(@Valid @RequestBody TestCollectionRequest request) {
        UUID id = testCollectionService.createTestCollection(request);
        return new ApiResponse<>(201, "Tạo bộ sưu tập thành công", id);
    }

    @GetMapping("/{id}")
////    @PreAuthorize("hasPermission(null, 'test.collection.view')")
    public ApiResponse<TestCollectionResponse> getTestCollectionById(@PathVariable UUID id) {
        TestCollectionResponse response = testCollectionService.getTestCollectionById(id);
        return new ApiResponse<>(200, "Lấy thông tin bộ sưu tập thành công", response);
    }

    @GetMapping("")
////    @PreAuthorize("hasPermission(null, 'test.collection.view')")
    public ApiResponse<PageableResponse<TestCollectionResponse>> getTestCollections(
            Pageable pageable,
            @RequestParam(name = "collection_name", required = false) String collectionName,
            @RequestParam(name = "slug", required = false) String slug,
            @RequestParam(name = "status", required = false) Integer status) {

        PageableResponse<TestCollectionResponse> response = testCollectionService.getTestCollections(
                pageable, collectionName, slug, status);
        return new ApiResponse<>(200, "Lấy danh sách bộ sưu tập thành công", response);
    }

    @GetMapping("/active")
    public ApiResponse<List<TestCollectionResponse>> getAllActiveCollections() {
        List<TestCollectionResponse> responses = testCollectionService.getAllActiveCollections();
        return new ApiResponse<>(200, "Lấy danh sách bộ sưu tập hoạt động thành công", responses);
    }

    @PutMapping("/{id}")
//    @PreAuthorize("hasPermission(null, 'test.collection.update')")
    public ApiResponse<UUID> updateTestCollection(
            @PathVariable UUID id,
            @Valid @RequestBody TestCollectionRequest request) {
        UUID updatedId = testCollectionService.updateTestCollection(id, request);
        return new ApiResponse<>(200, "Cập nhật bộ sưu tập thành công", updatedId);
    }

    @DeleteMapping("/{ids}")
//    @PreAuthorize("hasPermission(null, 'test.collection.delete')")
    public ApiResponse<List<UUID>> deleteTestCollections(@PathVariable List<UUID> ids) {
        List<UUID> deletedIds = testCollectionService.deleteTestCollections(ids);
        return new ApiResponse<>(200, "Xóa bộ sưu tập thành công", deletedIds);
    }

    @PatchMapping("/toggle-status/{id}")
//    @PreAuthorize("hasPermission(null, 'test.collection.toggle.status')")
    public ApiResponse<UUID> toggleActiveStatus(@PathVariable UUID id) {
        UUID toggledId = testCollectionService.toggleActiveStatus(id);
        return new ApiResponse<>(200, "Thay đổi trạng thái bộ sưu tập thành công", toggledId);
    }
    @GetMapping("/by-uuids")
    public ApiResponse<List<UUID>> getCollectionsByUuids(@RequestParam("uuids") List<UUID> uuids) {
        List<UUID> existingUuids = testCollectionService.getExistingCollectionUuids(uuids);
        return new ApiResponse<>(200, "Lấy danh sách ID bộ sưu tập tồn tại thành công", existingUuids);
    }
    @GetMapping("/by-uuids-detailed")
    public ApiResponse<List<TestCollectionResponse>> getCollectionDetailsByUuids(
            @RequestParam("uuids") List<UUID> uuids) {
        List<TestCollectionResponse> collections = testCollectionService.getCollectionDetailsByUuids(uuids);
        return new ApiResponse<>(200, "Lấy chi tiết bộ sưu tập thành công", collections);
    }

    @PatchMapping("/toggle-public/{id}")
//    @PreAuthorize("hasPermission(null, 'test.collection.update')")
    public ApiResponse<UUID> togglePublicStatus(@PathVariable UUID id) {
        UUID toggledId = testCollectionService.togglePublicStatus(id);
        return new ApiResponse<>(200, "Thay đổi trạng thái công khai bộ sưu tập thành công", toggledId);
    }

    @GetMapping("/accessible")
    public ApiResponse<PageableResponse<TestCollectionResponse>> getPublicCollections(
            Pageable pageable,
            @RequestParam(name = "collection_name", required = false) String collectionName) {

        PageableResponse<TestCollectionResponse> response =
                testCollectionService.getPublicCollections(pageable, collectionName);

        return new ApiResponse<>(200, "Lấy danh sách bộ sưu tập công khai thành công", response);
    }
}