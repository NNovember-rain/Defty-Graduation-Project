package com.defty.question_bank_service.service.impl;

import com.example.common_library.exceptions.AppException;
import com.example.common_library.exceptions.ErrorCode;
import com.defty.question_bank_service.dto.request.AnswerRequest;
import com.defty.question_bank_service.dto.response.AnswerResponse;
import com.defty.question_bank_service.entity.AnswerEntity;
import com.defty.question_bank_service.entity.QuestionEntity;
import com.defty.question_bank_service.enums.Status;
import com.defty.question_bank_service.mapper.AnswerMapper;
import com.defty.question_bank_service.repository.IAnswerRepository;
import com.defty.question_bank_service.repository.IQuestionRepository;
import com.defty.question_bank_service.service.IAnswerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AnswerService implements IAnswerService {

    private final IAnswerRepository answerRepository;
    private final IQuestionRepository questionRepository;
    private final AnswerMapper answerMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<AnswerResponse> get(UUID questionId, Status status, Pageable pageable) {
        Page<AnswerEntity> page = answerRepository.findWithFilters(
                questionId,
                Status.DELETED.getCode(),
                status != null ? status.getCode() : null,
                pageable
        );

        return page.map(answerMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public AnswerResponse getById(UUID id) {
        AnswerEntity answer = answerRepository.findByIdAndNotDeleted(id, Status.DELETED.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Answer not found"));
        return answerMapper.toResponse(answer);
    }

    @Override
    public AnswerResponse create(AnswerRequest request) {
        QuestionEntity question = questionRepository
                .findByIdAndNotDeleted(request.getQuestionId(), Status.DELETED.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Question not found or has been deleted"));

        AnswerEntity answer = answerMapper.toEntity(request);
        answer.setQuestion(question);
        answer.setStatus(Status.ACTIVE.getCode());

        return answerMapper.toResponse(answerRepository.save(answer));
    }

    @Override
    public AnswerResponse update(UUID id, AnswerRequest request) {
        AnswerEntity existing = answerRepository.findByIdAndNotDeleted(id, Status.DELETED.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Answer not found or deleted"));

        answerMapper.updateEntity(request, existing);

        if (!existing.getQuestion().getId().equals(request.getQuestionId())) {
            QuestionEntity question = questionRepository.findByIdAndStatus(request.getQuestionId(), Status.ACTIVE.getCode())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Question not found or inactive"));
            existing.setQuestion(question);
        }

        return answerMapper.toResponse(answerRepository.save(existing));
    }

    @Override
    public AnswerResponse toggleStatus(UUID id) {
        AnswerEntity answer = answerRepository.findByIdAndNotDeleted(id, Status.DELETED.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Answer not found or deleted"));

        if (answer.getStatus().equals(Status.ACTIVE.getCode())) {
            answer.setStatus(Status.INACTIVE.getCode());
        } else if (answer.getStatus().equals(Status.INACTIVE.getCode())) {
            answer.setStatus(Status.ACTIVE.getCode());
        }

        return answerMapper.toResponse(answerRepository.save(answer));
    }

    @Override
    public void softDelete(UUID id) {
        AnswerEntity answer = answerRepository.findByIdAndNotDeleted(id, Status.DELETED.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Answer not found or already deleted"));

        answer.setStatus(Status.DELETED.getCode());
        answerRepository.save(answer);
    }
}