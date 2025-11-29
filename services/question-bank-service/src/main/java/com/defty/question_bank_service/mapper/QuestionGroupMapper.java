package com.defty.question_bank_service.mapper;

import com.defty.question_bank_service.dto.request.QuestionGroupRequest;
import com.defty.question_bank_service.dto.response.FileProcessingResponse;
import com.defty.question_bank_service.dto.response.QuestionGroupResponse;
import com.defty.question_bank_service.dto.response.QuestionTagResponse;
import com.defty.question_bank_service.entity.QuestionGroupEntity;
import com.defty.question_bank_service.enums.Status;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class QuestionGroupMapper {

    private final ModelMapper modelMapper;
    private final FileMapper fileMapper;
    private final QuestionMapper questionMapper;

    public QuestionGroupResponse toResponse(QuestionGroupEntity entity) {
        QuestionGroupResponse response = modelMapper.map(entity, QuestionGroupResponse.class);

        // Map source
        response.setSource(entity.getSource());

        // Map sourceFileProcessing nếu có
        if (entity.getSourceFileProcessing() != null) {
            FileProcessingResponse fpResponse = new FileProcessingResponse();
            fpResponse.setId(entity.getSourceFileProcessing().getId());
            fpResponse.setTestSetId(entity.getSourceFileProcessing().getTestSet() != null
                    ? entity.getSourceFileProcessing().getTestSet().getId()
                    : null);
            fpResponse.setTestSetName(entity.getSourceFileProcessing().getTestSet() != null
                    ? entity.getSourceFileProcessing().getTestSet().getTestName()
                    : null);
            fpResponse.setPartType(entity.getSourceFileProcessing().getPartType() != null
                    ? entity.getSourceFileProcessing().getPartType().name()
                    : null);
            fpResponse.setStatus(entity.getSourceFileProcessing().getStatus());
            fpResponse.setTotalQuestionsFound(entity.getSourceFileProcessing().getTotalQuestionsFound());
            fpResponse.setQuestionsInserted(entity.getSourceFileProcessing().getQuestionsInserted());
            fpResponse.setQuestionsDuplicated(entity.getSourceFileProcessing().getQuestionsDuplicated());
            fpResponse.setQuestionsFailed(entity.getSourceFileProcessing().getQuestionsFailed());
            fpResponse.setManuallyResolved(entity.getSourceFileProcessing().getManuallyResolved());
            fpResponse.setExistingQuestionsCount(entity.getSourceFileProcessing().getExistingQuestionsCount());
            fpResponse.setErrorMessage(entity.getSourceFileProcessing().getErrorMessage());
            fpResponse.setIssueDetails(entity.getSourceFileProcessing().getIssueDetails());

            response.setSourceFileProcessing(fpResponse);
        }

        // Files
        if (entity.getFiles() != null) {
            response.setFiles(
                    entity.getFiles().stream()
                            .filter(f -> !f.getStatus().equals(Status.DELETED.getCode()))
                            .map(fileMapper::toResponse)
                            .collect(Collectors.toSet())
            );
        }

        // Questions + Answers
        if (entity.getQuestions() != null) {
            response.setQuestions(
                    entity.getQuestions().stream()
                            .filter(q -> !q.getStatus().equals(Status.DELETED.getCode()))
                            .map(questionMapper::toResponse)
                            .collect(Collectors.toSet())
            );

            // Tags (collect unique tags across all questions)
            response.setTags(
                    entity.getQuestions().stream()
                            .flatMap(q -> q.getQuestionTagMappings().stream())
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

    public QuestionGroupEntity toEntity(QuestionGroupRequest request) {
        return modelMapper.map(request, QuestionGroupEntity.class);
    }

    public void updateEntity(QuestionGroupRequest request, QuestionGroupEntity entity) {
        modelMapper.map(request, entity);
    }
}