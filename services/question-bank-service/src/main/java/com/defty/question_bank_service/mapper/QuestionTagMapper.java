package com.defty.question_bank_service.mapper;

import com.defty.question_bank_service.dto.request.QuestionTagRequest;
import com.defty.question_bank_service.dto.response.QuestionTagResponse;
import com.defty.question_bank_service.entity.QuestionTagEntity;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class QuestionTagMapper {
    private final ModelMapper modelMapper;
    public QuestionTagEntity toQuestionTagEntity(QuestionTagRequest request) {
        QuestionTagEntity entity = modelMapper.map(request, QuestionTagEntity.class);
        return entity;
    }

    public QuestionTagResponse toQuestionTagResponse(QuestionTagEntity entity) {
        QuestionTagResponse response = modelMapper.map(entity, QuestionTagResponse.class);
        return response;
    }

    public void updateQuestionTagFromRequest(QuestionTagRequest request, QuestionTagEntity entity) {
        modelMapper.map(request, entity);
        entity.setQuestionTagMappings(entity.getQuestionTagMappings());
    }
}
