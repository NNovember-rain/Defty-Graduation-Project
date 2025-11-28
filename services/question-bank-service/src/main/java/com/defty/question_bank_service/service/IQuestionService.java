package com.defty.question_bank_service.service;

import com.defty.question_bank_service.dto.request.QuestionRequest;
import com.defty.question_bank_service.dto.response.QuestionResponse;
import com.defty.question_bank_service.enums.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface IQuestionService {
    Page<QuestionResponse> get(UUID groupId, Status status, Pageable pageable);

    QuestionResponse getById(UUID id);

    QuestionResponse create(QuestionRequest request);

    QuestionResponse update(UUID id, QuestionRequest request);

    QuestionResponse toggleStatus(UUID id);

    void softDelete(UUID id);

    Set<QuestionResponse> getAccessibleQuestions(List<UUID> ids);
}