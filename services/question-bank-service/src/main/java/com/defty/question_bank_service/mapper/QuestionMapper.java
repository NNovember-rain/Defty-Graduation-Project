package com.defty.question_bank_service.mapper;

import com.defty.question_bank_service.dto.request.QuestionRequest;
import com.defty.question_bank_service.dto.response.AnswerResponse;
import com.defty.question_bank_service.dto.response.QuestionResponse;
import com.defty.question_bank_service.dto.response.QuestionTagResponse;
import com.defty.question_bank_service.entity.QuestionEntity;
import com.defty.question_bank_service.entity.QuestionTagMappingEntity;
import com.defty.question_bank_service.enums.Status;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class QuestionMapper {

    private final ModelMapper modelMapper;

    public QuestionEntity toEntity(QuestionRequest request) {
        return modelMapper.map(request, QuestionEntity.class);
    }

    public QuestionResponse toResponse(QuestionEntity entity) {
        QuestionResponse response = modelMapper.map(entity, QuestionResponse.class);

        // Gắn groupId vào response
        if (entity.getQuestionGroup() != null) {
            response.setQuestionGroupId(entity.getQuestionGroup().getId());
        }

        // Map answers
        if (entity.getAnswers() != null) {
            response.setAnswers(
                    entity.getAnswers().stream()
                            .filter(a -> !a.getStatus().equals(Status.DELETED.getCode())) // Bỏ câu trả lời đã xóa
                            .map(answer -> modelMapper.map(answer, AnswerResponse.class))
                            .collect(Collectors.toSet())
            );
        }

        // Map tags
        if (entity.getQuestionTagMappings() != null) {
            response.setTags(
                    entity.getQuestionTagMappings().stream()
                            .filter(mapping -> mapping.getQuestionTag() != null &&
                                    !mapping.getStatus().equals(Status.DELETED.getCode()))
                            .map(mapping -> {
                                QuestionTagResponse tagResponse = new QuestionTagResponse();
                                tagResponse.setId(mapping.getQuestionTag().getId());
                                tagResponse.setTagName(mapping.getQuestionTag().getTagName());
                                tagResponse.setDescription(mapping.getQuestionTag().getDescription());
                                return tagResponse;
                            })
                            .collect(Collectors.toSet())
            );
        }

        return response;
    }

    public void updateEntity(QuestionRequest request, QuestionEntity entity) {
        modelMapper.map(request, entity);
    }
}