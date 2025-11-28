package com.defty.question_bank_service.service;

import com.defty.question_bank_service.dto.response.ApiResponse;
import com.defty.question_bank_service.dto.response.PageableResponse;
import com.defty.question_bank_service.dto.request.QuestionTagRequest;
import com.defty.question_bank_service.dto.response.QuestionTagResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface IQuestionTagService {
    UUID createQuestionTag(QuestionTagRequest request);
    QuestionTagResponse getQuestionTagById(UUID id);
    PageableResponse<QuestionTagResponse> getQuestionTags(
            Pageable pageable,
            String tagName,
            String tagCategory,
            Integer status
    );
    UUID updateQuestionTag(UUID id, QuestionTagRequest request);
    List<UUID> deleteQuestionTags(List<UUID> ids);
    UUID toggleActiveStatus(UUID id);
    List<QuestionTagResponse> getAllActiveTags();
}
