package com.defty.question_bank_service.mapper;

import com.defty.question_bank_service.dto.request.AnswerRequest;
import com.defty.question_bank_service.dto.response.AnswerResponse;
import com.defty.question_bank_service.entity.AnswerEntity;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AnswerMapper {

    private final ModelMapper modelMapper;

    public AnswerEntity toEntity(AnswerRequest request) {
        return modelMapper.map(request, AnswerEntity.class);
    }

    public AnswerResponse toResponse(AnswerEntity entity) {
        AnswerResponse response = modelMapper.map(entity, AnswerResponse.class);
        response.setQuestionId(entity.getQuestion().getId());
        return response;
    }

    public void updateEntity(AnswerRequest request, AnswerEntity entity) {
        modelMapper.map(request, entity);
    }
}