package com.defty.question_bank_service.service.impl;
import com.defty.question_bank_service.dto.request.TestCollectionRequest;
import com.defty.question_bank_service.dto.response.PageableResponse;
import com.defty.question_bank_service.dto.response.TestCollectionResponse;
import com.defty.question_bank_service.entity.TestCollectionEntity;
import com.defty.question_bank_service.mapper.TestCollectionMapper;
import com.defty.question_bank_service.repository.ITestCollectionRepository;
import com.defty.question_bank_service.service.ITestCollectionService;
import com.example.common_library.exceptions.NotFoundException;
import com.defty.question_bank_service.utils.SlugUtils;
import com.defty.question_bank_service.validation.CollectionValidation;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TestCollectionService implements ITestCollectionService {

    private final ITestCollectionRepository testCollectionRepository;
    private final TestCollectionMapper testCollectionMapper;
    private final CollectionValidation testCollectionValidation;
    private final SlugUtils slugUtils;

    @Override
    @Transactional
    public UUID createTestCollection(TestCollectionRequest request) {
        log.info("Request received to create test collection: {}", request.getCollectionName());
        testCollectionValidation.fieldValidation(request, null);

        TestCollectionEntity entity = testCollectionMapper.toTestCollectionEntity(request);

        String slug = slugUtils.generateUniqueSlug(request.getCollectionName(), testCollectionRepository, null);
        entity.setSlug(slug);

        entity = testCollectionRepository.save(entity);
        log.info("Test collection '{}' saved successfully with ID: {}, slug={}", entity.getCollectionName(), entity.getId(), slug);

        return entity.getId();
    }

    @Override
    public TestCollectionResponse getTestCollectionById(UUID id) {
        TestCollectionEntity entity = testCollectionRepository.findByIdAndStatusNot(id, -1)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bộ sưu tập với ID: " + id));

        return testCollectionMapper.toTestCollectionResponse(entity);
    }

    @Override
    public PageableResponse<TestCollectionResponse> getTestCollections(
            Pageable pageable, String collectionName, String slug, Integer status) {

        Pageable sortedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by("createdDate").descending()
        );

        String collectionNameParam = (collectionName == null) ? "" : collectionName;
        String slugParam = (slug == null) ? "" : slug;

        Page<TestCollectionEntity> entities = testCollectionRepository.findTestCollections(
                collectionNameParam, slugParam, status, sortedPageable);

        List<TestCollectionResponse> responses = entities.getContent().stream()
                .map(testCollectionMapper::toTestCollectionResponse)
                .collect(Collectors.toList());

        return new PageableResponse<>(responses, entities.getTotalElements());
    }

    @Override
    public List<TestCollectionResponse> getAllActiveCollections() {
        List<TestCollectionEntity> entities = testCollectionRepository.findByStatusOrderByCollectionNameAsc(1);
        return entities.stream()
                .map(testCollectionMapper::toTestCollectionResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UUID updateTestCollection(UUID id, TestCollectionRequest request) {
        TestCollectionEntity entity = testCollectionRepository.findByIdAndStatus(id, 1)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bộ sưu tập với ID: " + id));

        testCollectionValidation.fieldValidation(request, id);

        testCollectionMapper.updateTestCollectionFromRequest(request, entity);

        String slug = SlugUtils.generateUniqueSlug(request.getCollectionName(), testCollectionRepository, id);
        entity.setSlug(slug);

        entity = testCollectionRepository.save(entity);
        return entity.getId();
    }
    @Override
    @Transactional
    public List<UUID> deleteTestCollections(List<UUID> ids) {
        List<TestCollectionEntity> entities = testCollectionRepository.findAllByIdInAndStatusNot(ids, -1);

        if (entities.isEmpty()) {
            throw new NotFoundException("Không tìm thấy bộ sưu tập nào để xóa");
        }

        entities.forEach(entity -> entity.setStatus(-1));
        testCollectionRepository.saveAll(entities);

        return entities.stream()
                .map(TestCollectionEntity::getId)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UUID toggleActiveStatus(UUID id) {
        TestCollectionEntity entity = testCollectionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bộ sưu tập với ID: " + id));

        Integer currentStatus = entity.getStatus();
        if (currentStatus != null) {
            if (currentStatus == 1) {
                entity.setStatus(0);
                testCollectionRepository.save(entity);
            } else if (currentStatus == 0) {
                entity.setStatus(1);
                testCollectionRepository.save(entity);
            }
        }

        return entity.getId();
    }
    @Override
    public List<UUID> getExistingCollectionUuids(List<UUID> uuids) {
        if (uuids == null || uuids.isEmpty()) {
            return List.of();
        }
        List<TestCollectionEntity> existingEntities =
                testCollectionRepository.findAllByIdInAndStatusNot(uuids, -1);

        return existingEntities.stream()
                .map(TestCollectionEntity::getId)
                .collect(Collectors.toList());
    }
    @Override
    public List<TestCollectionResponse> getCollectionDetailsByUuids(List<UUID> uuids) {
        log.info("Request to get collection details for {} UUIDs", uuids.size());

        if (uuids == null || uuids.isEmpty()) {
            log.warn("Empty UUID list provided");
            return Collections.emptyList();
        }

        try {
            // Tìm tất cả collections theo list UUIDs và status active
            List<TestCollectionEntity> collections = testCollectionRepository.findByIdInAndStatusNot(uuids, -1);

            if (collections.isEmpty()) {
                log.warn("No active collections found for provided UUIDs");
                return Collections.emptyList();
            }

            // Map entities sang responses
            List<TestCollectionResponse> responses = collections.stream()
                    .map(testCollectionMapper::toTestCollectionResponse)
                    .collect(Collectors.toList());

            log.info("Found {} active collections out of {} requested UUIDs", responses.size(), uuids.size());

            return responses;

        } catch (Exception e) {
            log.error("Error retrieving collection details by UUIDs: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi khi lấy thông tin chi tiết bộ sưu tập", e);
        }
    }

    @Override
    @Transactional
    public UUID togglePublicStatus(UUID id) {
        TestCollectionEntity entity = testCollectionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bộ sưu tập với ID: " + id));

        entity.setPublic(!Boolean.TRUE.equals(entity.isPublic()));
        log.info("Toggled public status for collection {} => {}", id, entity.isPublic());
        return entity.getId();
    }

    @Override
    public PageableResponse<TestCollectionResponse> getPublicCollections(Pageable pageable, String collectionName) {
        Pageable sortedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by("createdDate").descending()
        );

        String safeName = (collectionName == null) ? "" : collectionName.trim();
        Page<TestCollectionEntity> entities = testCollectionRepository.findPublicCollections(safeName, sortedPageable);

        List<TestCollectionResponse> responses = entities.getContent().stream()
                .map(testCollectionMapper::toTestCollectionPublicResponse)
                .toList();

        return new PageableResponse<>(responses, entities.getTotalElements());
    }
}