package com.defty.question_bank_service.service;

import com.defty.question_bank_service.dto.request.FileProcessingRequest;
import com.defty.question_bank_service.dto.response.FileProcessingResponse;
import com.defty.question_bank_service.dto.response.PageableResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface IFileProcessingService {

    UUID uploadTestFile(FileProcessingRequest fileProcessingRequest);

    FileProcessingResponse getProcessingById(UUID id);

    PageableResponse<FileProcessingResponse> getFileProcessings(
            Pageable pageable,
            UUID testSetId,
            String partType,
            Integer status
    );

    List<FileProcessingResponse> getProcessingsByTestSet(UUID testSetId);

    UUID markAsResolved(UUID id);

    List<UUID> deleteProcessings(List<UUID> ids);

    UUID cancelProcessing(UUID id);
}