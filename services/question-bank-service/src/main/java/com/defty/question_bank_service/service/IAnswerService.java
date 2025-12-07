package com.defty.question_bank_service.service;

import com.defty.question_bank_service.dto.request.AnswerRequest;
import com.defty.question_bank_service.dto.response.AnswerResponse;
import com.defty.question_bank_service.enums.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface IAnswerService {
    Page<AnswerResponse> get(UUID questionId, Status status, Pageable pageable);

    AnswerResponse getById(UUID id);

    AnswerResponse create(AnswerRequest request);

    AnswerResponse update(UUID id, AnswerRequest request);

    AnswerResponse toggleStatus(UUID id);

    void softDelete(UUID id);
}