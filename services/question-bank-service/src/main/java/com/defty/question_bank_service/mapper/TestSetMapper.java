package com.defty.question_bank_service.mapper;

import com.defty.question_bank_service.dto.request.TestSetRequest;
import com.defty.question_bank_service.dto.response.TestSetResponse;
import com.defty.question_bank_service.entity.TestSetEntity;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TestSetMapper {

    private final ModelMapper modelMapper;

    // ===== CREATE =====
    public TestSetEntity toTestSetEntity(TestSetRequest request) {
        TestSetEntity entity = modelMapper.map(request, TestSetEntity.class);
        entity.setPublic(false);
        return entity;
    }

    // ===== RESPONSE =====
    public TestSetResponse toTestSetResponse(TestSetEntity entity) {
        TestSetResponse response = modelMapper.map(entity, TestSetResponse.class);

        response.setIsPublic(entity.isPublic()); // ✅ map isPublic sang response

        if (entity.getCollection() != null) {
            response.setCollectionId(entity.getCollection().getId());
            response.setCollectionName(entity.getCollection().getCollectionName());
        }

        return response;
    }

    public TestSetResponse toPublicTestSetResponse(TestSetEntity entity) {
        TestSetResponse response = toTestSetResponse(entity);

        if (entity.getStats() != null) {
            response.setAttemptCount(entity.getStats().getAttemptCount());
            response.setCommentCount(entity.getStats().getCommentCount());
        } else {
            response.setAttemptCount(0L);
            response.setCommentCount(0L);
        }

        return response;
    }

    // ===== UPDATE =====
    public void updateTestSetFromRequest(TestSetRequest request, TestSetEntity entity) {
        entity.setTestName(request.getTestName());
        entity.setDescription(request.getDescription());
    }
}