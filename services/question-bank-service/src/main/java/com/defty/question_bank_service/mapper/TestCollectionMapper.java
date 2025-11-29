package com.defty.question_bank_service.mapper;

import com.defty.question_bank_service.dto.request.TestCollectionRequest;
import com.defty.question_bank_service.dto.response.TestCollectionResponse;
import com.defty.question_bank_service.entity.TestCollectionEntity;
import com.defty.question_bank_service.repository.ITestSetRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TestCollectionMapper {
    private final ModelMapper modelMapper;
    private final ITestSetRepository testSetRepository;
    public TestCollectionEntity toTestCollectionEntity(TestCollectionRequest request) {
        TestCollectionEntity entity = modelMapper.map(request, TestCollectionEntity.class);
        return entity;
    }

    public TestCollectionResponse toTestCollectionResponse(TestCollectionEntity entity) {
        TestCollectionResponse response = modelMapper.map(entity, TestCollectionResponse.class);
        long totalTests = testSetRepository.countByCollectionIdAndStatusNot(entity.getId(), -1);
        response.setTotalTests((int) totalTests);
        response.setIsPublic(entity.isPublic());
        return response;
    }

    public TestCollectionResponse toTestCollectionPublicResponse(TestCollectionEntity entity) {
        TestCollectionResponse response = modelMapper.map(entity, TestCollectionResponse.class);
        response.setIsPublic(entity.isPublic());
        return response;
    }

    public void updateTestCollectionFromRequest(TestCollectionRequest request, TestCollectionEntity entity) {
        entity.setCollectionName(request.getCollectionName());
        entity.setSlug(request.getSlug());
        entity.setDescription(request.getDescription());
        if (request.getTotalTests() != null) {
            entity.setTotalTests(request.getTotalTests());
        }
    }
}