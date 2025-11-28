package com.defty.question_bank_service.service;

import com.defty.question_bank_service.dto.request.QuestionGroupBulkRequest;
import com.defty.question_bank_service.dto.request.QuestionGroupRequest;
import com.defty.question_bank_service.dto.response.QuestionGroupResponse;
import com.defty.question_bank_service.enums.QuestionSource;
import com.defty.question_bank_service.enums.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

public interface IQuestionGroupService {
    Page<QuestionGroupResponse> getAll(
            Status status,
            List<UUID> testSetIds,
            List<UUID> excludeTestSetIds,
            List<UUID> tagIds,
            String questionPart,
            String difficulty,
            QuestionSource source,
            String sortBy,
            String sortOrder,
            int page,
            int limit
    );

    QuestionGroupResponse getById(UUID id);

    QuestionGroupResponse create(QuestionGroupRequest request);

    QuestionGroupResponse update(UUID id, QuestionGroupRequest request);

    QuestionGroupResponse toggleStatus(UUID id);

    void softDelete(UUID id);

    QuestionGroupResponse createBulk(QuestionGroupBulkRequest request, List<MultipartFile> uploadedFiles) throws IOException;

    QuestionGroupResponse updateBulk(UUID id, QuestionGroupBulkRequest request, List<MultipartFile> uploadedFiles) throws IOException;
    QuestionGroupResponse getQuestionGroupByQuestionId(UUID questionId);
}