package com.defty.question_bank_service.service.impl;

import com.example.common_library.exceptions.AppException;
import com.example.common_library.exceptions.ErrorCode;
//import com.example.common_library.file.CloudinaryFileService;
import com.defty.question_bank_service.dto.response.FileResponse;
import com.defty.question_bank_service.entity.FileEntity;
import com.defty.question_bank_service.entity.QuestionGroupEntity;
import com.defty.question_bank_service.enums.FileType;
import com.defty.question_bank_service.enums.Status;
import com.defty.question_bank_service.mapper.FileMapper;
import com.defty.question_bank_service.repository.IFileRepository;
import com.defty.question_bank_service.repository.IQuestionGroupRepository;
import com.defty.question_bank_service.service.IFileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class FileService implements IFileService {

    private final IFileRepository fileRepository;
    private final IQuestionGroupRepository groupRepository;
//    private final CloudinaryFileService cloudinaryFileService;
    private final FileMapper fileMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<FileResponse> get(UUID groupId, Status status, Pageable pageable) {
        Page<FileEntity> page = fileRepository.findWithFilters(
                groupId,
                Status.DELETED.getCode(),
                status != null ? status.getCode() : null,
                pageable
        );

        return page.map(fileMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public FileResponse getById(UUID id) {
        FileEntity file = fileRepository.findByIdAndStatus(id, Status.ACTIVE.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "File not found or deleted"));
        return fileMapper.toResponse(file);
    }

    @Override
    public FileResponse create(MultipartFile file, FileType type, UUID questionGroupId, Integer displayOrder) throws IOException {
        QuestionGroupEntity group = groupRepository.findByIdAndNotDeleted(questionGroupId, Status.DELETED.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Question group not found or deleted"));

        // Upload file lên Cloudinary và lấy URL
//        String fileUrl = cloudinaryFileService.uploadFile(file);

        FileEntity entity = new FileEntity();
        entity.setType(type);
//        entity.setUrl(fileUrl);
        entity.setDisplayOrder(displayOrder);
        entity.setQuestionGroup(group);
        entity.setStatus(Status.ACTIVE.getCode());

        return fileMapper.toResponse(fileRepository.save(entity));
    }

    @Override
    public FileResponse update(UUID id, MultipartFile file, FileType type, UUID questionGroupId, Integer displayOrder) throws IOException {
        FileEntity existing = fileRepository.findByIdAndStatus(id, Status.ACTIVE.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "File not found or deleted"));

        QuestionGroupEntity group = groupRepository.findByIdAndNotDeleted(questionGroupId, Status.DELETED.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Question group not found or deleted"));

//        String fileUrl = cloudinaryFileService.uploadFile(file);

        existing.setType(type);
//        existing.setUrl(fileUrl);
        existing.setDisplayOrder(displayOrder);
        existing.setQuestionGroup(group);

        return fileMapper.toResponse(fileRepository.save(existing));
    }

    @Override
    public FileResponse toggleStatus(UUID id) {
        FileEntity file = fileRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "File not found"));

        if (file.getStatus().equals(Status.ACTIVE.getCode())) {
            file.setStatus(Status.INACTIVE.getCode());
        } else if (file.getStatus().equals(Status.INACTIVE.getCode())) {
            file.setStatus(Status.ACTIVE.getCode());
        }

        return fileMapper.toResponse(fileRepository.save(file));
    }

    @Override
    public void softDelete(UUID id) {
        FileEntity file = fileRepository.findByIdAndStatus(id, Status.ACTIVE.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "File not found or already deleted"));

        file.setStatus(Status.DELETED.getCode());
        fileRepository.save(file);
    }
}