package com.defty.question_bank_service.service.impl;

import com.defty.question_bank_service.dto.request.AssignTestSetsRequest;
import com.defty.question_bank_service.dto.request.UpdateAssignmentRequest;
import com.defty.question_bank_service.dto.response.ClassTestSetResponse;
import com.defty.question_bank_service.entity.ClassTestSetEntity;
import com.defty.question_bank_service.entity.TestSetEntity;
import com.defty.question_bank_service.repository.IClassTestSetRepository;
import com.defty.question_bank_service.repository.ITestSetRepository;
import com.defty.question_bank_service.service.IClassTestSetService;
import com.example.common_library.exceptions.AppException;
import com.example.common_library.exceptions.ErrorCode;
import com.example.common_library.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClassTestSetServiceImpl implements IClassTestSetService {

    private final IClassTestSetRepository classTestSetRepository;
    private final ITestSetRepository testSetRepository;

    @Override
    @Transactional
    public List<Long> assignTestSetsToClasses(AssignTestSetsRequest request, Long teacherId) {
        List<Long> assignmentIds = new ArrayList<>();

        // Validate all test sets exist and are active
        List<UUID> testSetIds = request.getTestSets().stream()
                .map(AssignTestSetsRequest.TestSetAssignment::getTestSetId)
                .collect(Collectors.toList());

        List<TestSetEntity> testSets = testSetRepository.findAllById(testSetIds);

        if (testSets.size() != testSetIds.size()) {
            throw new NotFoundException("Một hoặc nhiều bài test không tồn tại");
        }

        // Validate all test sets are active
        List<TestSetEntity> inactiveTests = testSets.stream()
                .filter(ts -> ts.getStatus() != 1)
                .collect(Collectors.toList());

        if (!inactiveTests.isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "Các bài test sau không thể gán vì đang ngừng hoạt động: " +
                            inactiveTests.stream().map(TestSetEntity::getTestName).collect(Collectors.joining(", ")));
        }

        Map<UUID, TestSetEntity> testSetMap = testSets.stream()
                .collect(Collectors.toMap(TestSetEntity::getId, ts -> ts));

        // Assign each test set to each class
        for (Long classId : request.getClassIds()) {
            for (AssignTestSetsRequest.TestSetAssignment testSetAssignment : request.getTestSets()) {
                UUID testSetId = testSetAssignment.getTestSetId();

                // Check if already assigned
                if (classTestSetRepository.existsByClassIdAndTestSet_IdAndStatusNot(classId, testSetId, -1)) {
                    log.warn("Test set {} already assigned to class {}", testSetId, classId);
                    continue;
                }

                TestSetEntity testSet = testSetMap.get(testSetId);

                ClassTestSetEntity assignment = ClassTestSetEntity.builder()
                        .classId(classId)
                        .testSet(testSet)
                        .startDate(testSetAssignment.getStartDate())
                        .endDate(testSetAssignment.getEndDate())
                        .assignedBy(teacherId)
                        .isActive(true)
                        .build();

                ClassTestSetEntity saved = classTestSetRepository.save(assignment);
                assignmentIds.add(saved.getId());

                log.info("Assigned test set {} to class {} by teacher {}", testSetId, classId, teacherId);
            }
        }

        return assignmentIds;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ClassTestSetResponse> getTestSetsByClassId(Long classId, Pageable pageable) {
        Page<ClassTestSetEntity> entities = classTestSetRepository.findByClassIdWithDetails(classId, pageable);
        return entities.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassTestSetResponse> getAllTestSetsByClassId(Long classId) {
        List<ClassTestSetEntity> entities = classTestSetRepository.findByClassId(classId);
        return entities.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ClassTestSetResponse getAssignmentById(Long assignmentId) {
        ClassTestSetEntity entity = classTestSetRepository.findById(assignmentId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy assignment với ID: " + assignmentId));

        return mapToResponse(entity);
    }

    @Override
    @Transactional
    public Long updateAssignment(Long assignmentId, UpdateAssignmentRequest request) {
        ClassTestSetEntity entity = classTestSetRepository.findById(assignmentId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy assignment với ID: " + assignmentId));

        if (request.getStartDate() != null) {
            entity.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            entity.setEndDate(request.getEndDate());
        }
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }

        ClassTestSetEntity updated = classTestSetRepository.save(entity);
        log.info("Updated assignment {}: startDate={}, endDate={}, isActive={}",
                assignmentId, updated.getStartDate(), updated.getEndDate(), updated.getIsActive());

        return updated.getId();
    }

    @Override
    @Transactional
    public void removeTestSetFromClass(Long classId, UUID testSetId) {
        ClassTestSetEntity entity = classTestSetRepository
                .findByClassIdAndTestSetId(classId, testSetId)
                .orElseThrow(() -> new NotFoundException(
                        "Không tìm thấy assignment cho class " + classId + " và test set " + testSetId));

        entity.setIsActive(false);
        classTestSetRepository.save(entity);

        log.info("Soft deleted assignment: class={}, testSet={}", classId, testSetId);
    }

    @Override
    @Transactional
    public void removeTestSetsFromClass(Long classId, List<UUID> testSetIds) {
        classTestSetRepository.softDeleteByClassIdAndTestSetIds(classId, testSetIds);
        log.info("Soft deleted {} test sets from class {}", testSetIds.size(), classId);
    }

    @Override
    @Transactional
    public void deleteAssignment(Long assignmentId) {
        if (!classTestSetRepository.existsById(assignmentId)) {
            throw new NotFoundException("Không tìm thấy assignment với ID: " + assignmentId);
        }

        classTestSetRepository.deleteById(assignmentId);
        log.info("Permanently deleted assignment {}", assignmentId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassTestSetResponse> getClassesByTestSetId(UUID testSetId) {
        List<ClassTestSetEntity> entities = classTestSetRepository.findByTestSetId(testSetId);
        return entities.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassTestSetResponse> getActiveTestSetsByClassId(Long classId) {
        List<ClassTestSetEntity> entities = classTestSetRepository.findActiveTestSetsByClassId(classId);
        return entities.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Helper method
    private ClassTestSetResponse mapToResponse(ClassTestSetEntity entity) {
        TestSetEntity testSet = entity.getTestSet();

        return ClassTestSetResponse.builder()
                .id(entity.getId())
                .classId(entity.getClassId())
                .testSetId(testSet.getId())
                .testSetName(testSet.getTestName())
                .testSetSlug(testSet.getSlug())
                .collectionName(testSet.getCollection() != null ? testSet.getCollection().getCollectionName() : null)
                .totalQuestions(testSet.getTotalQuestions() != null ? testSet.getTotalQuestions() : 0)
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .assignedBy(entity.getAssignedBy())
                .isActive(entity.getIsActive())
                .status(entity.getStatus())
                .createdDate(entity.getCreatedDate())
                .modifiedDate(entity.getModifiedDate())
                .build();
    }
}