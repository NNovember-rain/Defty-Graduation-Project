package com.defty.question_bank_service.mapper;

import com.defty.question_bank_service.dto.request.FileProcessingRequest;
import com.defty.question_bank_service.dto.response.FileProcessingResponse;
import com.defty.question_bank_service.entity.FileProcessingEntity;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class FileProcessingMapper {
    private final ModelMapper modelMapper;
    //STATUS: -1 DELETED, 0: CANCELED, 1 COMPLETED; 2: PROCESSING, 3: PENDING, 4: FAILED
    public FileProcessingEntity toFileProcessingEntity(FileProcessingRequest request) {
        FileProcessingEntity entity = modelMapper.map(request, FileProcessingEntity.class);
        return entity;
    }
    public FileProcessingResponse toFileProcessingResponse(FileProcessingEntity fileProcessingEntity) {
        FileProcessingResponse processingResponse = modelMapper.map(fileProcessingEntity, FileProcessingResponse.class);
        if (fileProcessingEntity.getTestSet() != null) {
            processingResponse.setTestSetId(fileProcessingEntity.getTestSet().getId());
            processingResponse.setTestSetName(fileProcessingEntity.getTestSet().getTestName());
        }
        return processingResponse;
    }
}
