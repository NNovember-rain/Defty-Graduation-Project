package com.defty.question_bank_service.service.impl;

import com.example.common_library.exceptions.AppException;
import com.example.common_library.exceptions.ErrorCode;
import com.defty.question_bank_service.dto.request.QuestionRequest;
import com.defty.question_bank_service.dto.response.QuestionResponse;
import com.defty.question_bank_service.entity.QuestionEntity;
import com.defty.question_bank_service.entity.QuestionGroupEntity;
import com.defty.question_bank_service.enums.Status;
import com.defty.question_bank_service.mapper.QuestionMapper;
import com.defty.question_bank_service.repository.IQuestionGroupRepository;
import com.defty.question_bank_service.repository.IQuestionRepository;
import com.defty.question_bank_service.service.IQuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class QuestionService implements IQuestionService {

    private final IQuestionRepository questionRepository;
    private final IQuestionGroupRepository groupRepository;
    private final QuestionMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public Page<QuestionResponse> get(UUID groupId, Status status, Pageable pageable) {
        return questionRepository.findWithFiltersAndAnswers(
                groupId,
                Status.DELETED.getCode(),
                status != null ? status.getCode() : null,
                pageable
        ).map(question -> {
            Optional.ofNullable(question.getAnswers())
                    .ifPresent(answers -> answers.removeIf(a -> a.getStatus().equals(Status.DELETED.getCode())));

            return mapper.toResponse(question);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public QuestionResponse getById(UUID id) {
        QuestionEntity question = questionRepository.findByIdAndNotDeleted(id, Status.DELETED.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Question not found or deleted"));

        return mapper.toResponse(question);
    }

    @Override
    public QuestionResponse create(QuestionRequest request) {
        QuestionGroupEntity group = groupRepository.findByIdAndNotDeleted(request.getQuestionGroupId(), Status.DELETED.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Question group not found or deleted"));

        QuestionEntity entity = mapper.toEntity(request);
        entity.setQuestionGroup(group);
        entity.setStatus(Status.ACTIVE.getCode());

        return mapper.toResponse(questionRepository.save(entity));
    }

    @Override
    public QuestionResponse update(UUID id, QuestionRequest request) {
        QuestionEntity existing = questionRepository.findByIdAndNotDeleted(id, Status.DELETED.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Question not found or deleted"));

        mapper.updateEntity(request, existing);

        if (!existing.getQuestionGroup().getId().equals(request.getQuestionGroupId())) {
            QuestionGroupEntity group = groupRepository.findByIdAndNotDeleted(request.getQuestionGroupId(), Status.DELETED.getCode())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Question group not found or deleted"));
            existing.setQuestionGroup(group);
        }

        return mapper.toResponse(questionRepository.save(existing));
    }

    @Override
    public QuestionResponse toggleStatus(UUID id) {
        QuestionEntity question = questionRepository.findByIdAndNotDeleted(id, Status.DELETED.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Question not found or deleted"));

        if (question.getStatus().equals(Status.ACTIVE.getCode())) {
            question.setStatus(Status.INACTIVE.getCode());
        } else if (question.getStatus().equals(Status.INACTIVE.getCode())) {
            question.setStatus(Status.ACTIVE.getCode());
        }

        return mapper.toResponse(questionRepository.save(question));
    }

    @Override
    public void softDelete(UUID id) {
        QuestionEntity question = questionRepository.findByIdAndNotDeleted(id, Status.DELETED.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Question not found or already deleted"));

        question.setStatus(Status.DELETED.getCode());
        questionRepository.save(question);
    }

    @Override
    @Transactional(readOnly = true)
    public Set<QuestionResponse> getAccessibleQuestions(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) return Set.of();

        List<QuestionEntity> questions = questionRepository.findAllWithRelationsByIds(ids);

        List<QuestionEntity> filtered = questions.stream()
                .filter(q -> Objects.equals(q.getStatus(), Status.ACTIVE.getCode()))
                .peek(q -> {
                    if (q.getAnswers() != null) {
                        q.getAnswers().removeIf(a ->
                                Objects.equals(a.getStatus(), Status.DELETED.getCode())
                        );
                    }
                    if (q.getQuestionTagMappings() != null) {
                        q.getQuestionTagMappings().removeIf(m ->
                                m.getQuestionTag() == null ||
                                        Objects.equals(m.getQuestionTag().getStatus(), Status.DELETED.getCode())
                        );
                    }
                })
                .toList();

        return ids.stream()
                .map(id -> filtered.stream().filter(q -> q.getId().equals(id)).findFirst().orElse(null))
                .filter(Objects::nonNull)
                .map(mapper::toResponse)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}