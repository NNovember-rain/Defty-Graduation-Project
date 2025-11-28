package com.defty.question_bank_service.service;

import com.defty.question_bank_service.dto.response.FileResponse;
import com.defty.question_bank_service.enums.FileType;
import com.defty.question_bank_service.enums.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

public interface IFileService {
    Page<FileResponse> get(UUID groupId, Status status, Pageable pageable);

    FileResponse getById(UUID id);

    FileResponse create(MultipartFile file, FileType type, UUID questionGroupId, Integer displayOrder) throws IOException;

    FileResponse update(UUID id, MultipartFile file, FileType type, UUID questionGroupId, Integer displayOrder) throws IOException;

    FileResponse toggleStatus(UUID id);

    void softDelete(UUID id);
}