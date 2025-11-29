package com.defty.question_bank_service.service;

import com.defty.question_bank_service.dto.response.PageableResponse;
import com.defty.question_bank_service.dto.request.TestCollectionRequest;
import com.defty.question_bank_service.dto.response.TestCollectionResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface ITestCollectionService {
    UUID createTestCollection(TestCollectionRequest request);

    TestCollectionResponse getTestCollectionById(UUID id);

    PageableResponse<TestCollectionResponse> getTestCollections(
            Pageable pageable,
            String collectionName,
            String slug,
            Integer status
    );

    UUID updateTestCollection(UUID id, TestCollectionRequest request);

    List<UUID> deleteTestCollections(List<UUID> ids);

    UUID toggleActiveStatus(UUID id);

    List<TestCollectionResponse> getAllActiveCollections();
    List<UUID> getExistingCollectionUuids(List<UUID> uuids);
    List<TestCollectionResponse> getCollectionDetailsByUuids(List<UUID> uuids);

    UUID togglePublicStatus(UUID id);
    PageableResponse<TestCollectionResponse> getPublicCollections(Pageable pageable, String collectionName);
}
