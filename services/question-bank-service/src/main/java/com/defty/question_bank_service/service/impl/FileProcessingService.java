//package com.defty.question_bank_service.service.impl;
//
//import com.defty.common_library.kafka.KafkaProducerService;
//import com.defty.question_bank_service.dto.request.FileProcessingRequest;
//import com.defty.question_bank_service.dto.response.FileProcessingResponse;
//import com.defty.question_bank_service.entity.FileProcessingEntity;
//import com.defty.question_bank_service.entity.TestSetEntity;
//import com.defty.question_bank_service.enums.PartType;
//import com.defty.question_bank_service.mapper.FileProcessingMapper;
//import com.defty.question_bank_service.repository.IFileProcessingRepository;
//import com.defty.question_bank_service.repository.ITestSetRepository;
//import com.defty.question_bank_service.service.IFileProcessingService;
//import com.defty.question_bank_service.validation.FileProcessingValidation;
//import com.defty.common_library.dto.response.PageableResponse;
//import com.defty.common_library.exceptions.BadRequestException;
//import com.defty.common_library.exceptions.NotFoundException;
//import jakarta.transaction.Transactional;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.data.domain.Page;
//import org.springframework.data.domain.PageRequest;
//import org.springframework.data.domain.Pageable;
//import org.springframework.data.domain.Sort;
//import org.springframework.stereotype.Service;
//import org.springframework.web.multipart.MultipartFile;
//
//import java.io.File;
//import java.io.IOException;
//import java.nio.file.Files;
//import java.nio.file.Path;
//import java.nio.file.Paths;
//import java.security.MessageDigest;
//import java.security.NoSuchAlgorithmException;
//import java.time.LocalDateTime;
//import java.util.HashMap;
//import java.util.List;
//import java.util.Map;
//import java.util.UUID;
//import java.util.stream.Collectors;
//
//@Service
//@RequiredArgsConstructor
//@Slf4j
//public class FileProcessingService implements IFileProcessingService {
//    private final KafkaProducerService kafkaProducerService;
//    private final IFileProcessingRepository fileProcessingRepository;
//    private final ITestSetRepository testSetRepository;
//    private final FileProcessingMapper fileProcessingMapper;
//    private final FileProcessingValidation fileProcessingValidation;
//
//    @Value("${file.upload.path}")
//    private String uploadPath;
//    @Value("${app.kafka-topic-test-set-upload}")
//    private String uploadTopic;
//
//
//    @Override
//    @Transactional
//    public UUID uploadTestFile(FileProcessingRequest request) {
//        log.info("Starting file upload for testSetId: {}, partType: {}",
//                request.getTestSetId(), request.getPartType());
//
//        fileProcessingValidation.fieldValidation(request);
//
//        TestSetEntity testSet = testSetRepository.findByIdAndStatusNot(request.getTestSetId(), -1)
//                .orElseThrow(() -> new NotFoundException(
//                        "Không tìm thấy bộ đề với ID: " + request.getTestSetId()));
//
//        PartType partTypeEnum = PartType.valueOf(request.getPartType().toUpperCase());
//
//        try {
//            String filePath = saveFile(request.getFile(), request.getTestSetId(), partTypeEnum);
//
//            FileProcessingEntity entity = fileProcessingMapper
//                    .toFileProcessingEntity(request);
//
//            //STATUS: -1 DELETED, 0: CANCELED, 1 COMPLETED; 2: PROCESSING, 3: PENDING, 4: FAILED
//            entity.setStatus(2);
//            entity.setTestSet(testSet);
//            entity = fileProcessingRepository.save(entity);
//
//            // Tạo payload gửi sang AI service
//            Map<String, Object> message = new HashMap<>();
//            message.put("uploadId", entity.getId());
//            message.put("fileStoragePath", filePath);
//            message.put("partType", request.getPartType());
//
//            // Publish Kafka message
//            kafkaProducerService.send(uploadTopic, message);
//
//
//            log.info("File uploaded & sent to AI service, processId: {}", entity.getId());
//            return entity.getId();
//
//        } catch (IOException e) {
//            log.error("Error processing file upload", e);
//            throw new BadRequestException("Không thể xử lý file: " + e.getMessage());
//        }
//    }
//
//
//    @Override
//    public FileProcessingResponse getProcessingById(UUID id) {
//        fileProcessingValidation.validateProcessingExists(id);
//
//        FileProcessingEntity entity = fileProcessingRepository.findByIdWithTestSet(id)
//                .orElseThrow(() -> new NotFoundException(
//                        "Không tìm thấy bản ghi xử lý với ID: " + id));
//
//        return fileProcessingMapper.toFileProcessingResponse(entity);
//    }
//
//    @Override
//    public PageableResponse<FileProcessingResponse> getFileProcessings(
//            Pageable pageable, UUID testSetId, String partType, Integer status) {
//
//        Pageable sortedPageable = PageRequest.of(
//                pageable.getPageNumber(),
//                pageable.getPageSize(),
//                Sort.by("createdDate").descending()
//        );
//
//        PartType partTypeEnum = null;
//        if (partType != null && !partType.isEmpty()) {
//            try {
//                partTypeEnum = PartType.valueOf(partType.toUpperCase());
//            } catch (IllegalArgumentException e) {
//                throw new BadRequestException("Loại phần thi không hợp lệ: " + partType);
//            }
//        }
//
//        Page<FileProcessingEntity> entities = fileProcessingRepository.findFileProcessings(
//                testSetId, partTypeEnum, status, sortedPageable);
//
//        List<FileProcessingResponse> responses = entities.getContent().stream()
//                .map(fileProcessingMapper::toFileProcessingResponse)
//                .collect(Collectors.toList());
//
//        return new PageableResponse<>(responses, entities.getTotalElements());
//    }
//
//    @Override
//    public List<FileProcessingResponse> getProcessingsByTestSet(UUID testSetId) {
//        List<FileProcessingEntity> entities = fileProcessingRepository
//                .findByTestSetIdOrderByCreatedDateDesc(testSetId);
//
//        return entities.stream()
//                .map(fileProcessingMapper::toFileProcessingResponse)
//                .collect(Collectors.toList());
//    }
//
//    @Override
//    @Transactional
//    public UUID markAsResolved(UUID id) {
//        fileProcessingValidation.validateProcessingExists(id);
//
//        FileProcessingEntity entity = fileProcessingRepository.findById(id)
//                .orElseThrow(() -> new NotFoundException(
//                        "Không tìm thấy bản ghi xử lý với ID: " + id));
//
//        entity.setManuallyResolved(true);
//        entity.setResolvedAt(LocalDateTime.now());
//
//        entity = fileProcessingRepository.save(entity);
//
//        log.info("Processing {} marked as resolved by {}", id);
//        return entity.getId();
//    }
//
//    @Override
//    @Transactional
//    public List<UUID> deleteProcessings(List<UUID> ids) {
//        List<FileProcessingEntity> entities = fileProcessingRepository.findAllById(ids);
//
//        if (entities.isEmpty()) {
//            throw new NotFoundException("Không tìm thấy bản ghi xử lý nào để xóa");
//        }
//
//        entities.forEach(entity -> entity.setStatus(-1));
//        fileProcessingRepository.saveAll(entities);
//
//        return entities.stream()
//                .map(FileProcessingEntity::getId)
//                .collect(Collectors.toList());
//    }
//
//    @Override
//    @Transactional
//    public UUID cancelProcessing(UUID id) {
//        fileProcessingValidation.validateProcessingExists(id);
//
//        FileProcessingEntity entity = fileProcessingRepository.findById(id)
//                .orElseThrow(() -> new NotFoundException(
//                        "Không tìm thấy bản ghi xử lý với ID: " + id));
//        //STATUS: -1 DELETED, 0: CANCELED, 1 COMPLETED; 2: PROCESSING, 3: PENDING, 4: FAILED
//        // Không cho cancel nếu đã COMPLETED hoặc đã CANCELLED
//        Integer status = entity.getStatus();
//        if (status == 1 || status == -1 || status == 4) {
//            throw new BadRequestException("Không thể hủy file đã xử lý: deleted, completed, failed!");
//        }
//        if (status == 0) {
//            throw new BadRequestException("File đã bị hủy trước đó!");
//        }
//
//        entity.setStatus(0);
//        entity.setCompletedAt(LocalDateTime.now());
//
//        entity = fileProcessingRepository.save(entity);
//
//        log.info("Processing {} has been cancelled", id);
//        return entity.getId();
//    }
//
//
//    // Helper methods
//    private String saveFile(MultipartFile file, UUID testSetId, PartType partType) throws IOException {
//        // Create directory structure: uploads/pdf/{testSetId}/{partType}/
//        String directory = uploadPath + File.separator + testSetId + File.separator + partType;
//        Path dirPath = Paths.get(directory);
//        Files.createDirectories(dirPath);
//
//        // Generate unique filename
//        String originalFilename = file.getOriginalFilename();
//        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
//        String uniqueFilename = UUID.randomUUID().toString() + extension;
//
//        Path filePath = dirPath.resolve(uniqueFilename);
//        Files.write(filePath, file.getBytes());
//
//        return filePath.toString();
//    }
//}