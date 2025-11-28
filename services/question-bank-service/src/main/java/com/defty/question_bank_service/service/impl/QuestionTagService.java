package com.defty.question_bank_service.service.impl;
import com.defty.question_bank_service.dto.request.QuestionTagRequest;
import com.defty.question_bank_service.dto.response.PageableResponse;
import com.defty.question_bank_service.dto.response.QuestionTagResponse;
import com.defty.question_bank_service.entity.QuestionTagEntity;
import com.defty.question_bank_service.mapper.QuestionTagMapper;
import com.defty.question_bank_service.repository.IQuestionTagRepository;
import com.defty.question_bank_service.service.IQuestionTagService;
import com.defty.question_bank_service.validation.QuestionTagValidation;
import com.example.common_library.exceptions.NotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionTagService implements IQuestionTagService {

    private final IQuestionTagRepository questionTagRepository;
    private final QuestionTagMapper questionTagMapper;
    private final QuestionTagValidation questionTagValidation;

    @Override
    @Transactional
    public UUID createQuestionTag(QuestionTagRequest request) {
        log.info("Request received to create question tag: {}", request.getTagName());
        questionTagValidation.fieldValidation(request, null);

        QuestionTagEntity entity = questionTagMapper.toQuestionTagEntity(request);
        entity = questionTagRepository.save(entity);

        log.info("Question tag '{}' saved successfully with ID: {}", entity.getTagName(), entity.getId());
        return entity.getId();
    }

    @Override
    public QuestionTagResponse getQuestionTagById(UUID id) {
        QuestionTagEntity entity = questionTagRepository.findByIdAndStatusNot(id, -1)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thẻ câu hỏi với ID: " + id));

        return questionTagMapper.toQuestionTagResponse(entity);
    }

    @Override
    public PageableResponse<QuestionTagResponse> getQuestionTags(
            Pageable pageable, String tagName, String tagCategory, Integer status) {

        Pageable sortedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by("createdDate").descending()
        );

        String tagNameParam = (tagName == null) ? "" : tagName;

        Page<QuestionTagEntity> entities = questionTagRepository.findQuestionTags(
                tagNameParam, status, sortedPageable);

        List<QuestionTagResponse> responses = entities.getContent().stream()
                .map(questionTagMapper::toQuestionTagResponse)
                .collect(Collectors.toList());

        return new PageableResponse<>(responses, entities.getTotalElements());
    }

    @Override
    public List<QuestionTagResponse> getAllActiveTags() {
        List<QuestionTagEntity> entities = questionTagRepository.findByStatusOrderByTagNameAsc(1);
        return entities.stream()
                .map(questionTagMapper::toQuestionTagResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UUID updateQuestionTag(UUID id, QuestionTagRequest request) {
        QuestionTagEntity entity = questionTagRepository.findByIdAndStatus(id, 1)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thẻ câu hỏi với ID: " + id));

        questionTagValidation.fieldValidation(request, id);

        questionTagMapper.updateQuestionTagFromRequest(request, entity);
        entity = questionTagRepository.save(entity);

        return entity.getId();
    }

    @Override
    @Transactional
    public List<UUID> deleteQuestionTags(List<UUID> ids) {
        List<QuestionTagEntity> entities = questionTagRepository.findAllByIdInAndStatusNot(ids, -1);

        if (entities.isEmpty()) {
            throw new NotFoundException("Không tìm thấy thẻ câu hỏi nào để xóa");
        }

        entities.forEach(entity -> entity.setStatus(-1));
        questionTagRepository.saveAll(entities);

        return entities.stream()
                .map(QuestionTagEntity::getId)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UUID toggleActiveStatus(UUID id) {
        QuestionTagEntity entity = questionTagRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thẻ câu hỏi với ID: " + id));

        Integer currentStatus = entity.getStatus();
        if (currentStatus != null) {
            if (currentStatus == 1) {
                entity.setStatus(0);
                questionTagRepository.save(entity);
            } else if (currentStatus == 0) {
                entity.setStatus(1);
                questionTagRepository.save(entity);
            }
        }

        return entity.getId();
    }
}

