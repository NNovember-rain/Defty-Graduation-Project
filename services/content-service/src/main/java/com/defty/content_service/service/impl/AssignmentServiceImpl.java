package com.defty.content_service.service.impl;

import com.defty.content_service.client.IdentityServiceClient;
import com.defty.content_service.dto.request.AssignmentRequest;
import com.defty.content_service.dto.response.AssignmentResponse;
import com.defty.content_service.entity.Assignment;
import com.defty.content_service.entity.AssignmentClass;
import com.defty.content_service.entity.TypeUML;
import com.defty.content_service.repository.AssignmentClassRepository;
import com.defty.content_service.repository.AssignmentRepository;
import com.defty.content_service.repository.TypeUMLRepository;
import com.defty.content_service.service.AssignmentService;
import com.defty.content_service.specification.AssignmentSpecification;
import com.example.common_library.exceptions.NotFoundException;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AssignmentServiceImpl implements AssignmentService {
    AssignmentRepository assignmentRepository;
    AssignmentClassRepository assignmentClassRepository;
    TypeUMLRepository typeUMLRepository;
    IdentityServiceClient identityServiceClient;

    @Override
    public Page<AssignmentResponse> getAllAssignments(Long classId, Long typeUmlId, String title, Pageable pageable) {
        //TODO: Chua check classID
        Specification<Assignment> spec = Specification.where(AssignmentSpecification.hasTypeUmlId(typeUmlId))
                .and(AssignmentSpecification.hasTitleLike(title))
                .and(AssignmentSpecification.hasClassId(classId))
                .and(AssignmentSpecification.isActiveOnly());

        Page<Assignment> assignments = assignmentRepository.findAll(spec, pageable);

        return assignments.map(assignment -> {
            List<Long> classIds = assignmentClassRepository.findByAssignmentId(assignment.getId())
                    .stream()
                    .map(AssignmentClass::getClassId)
                    .toList();

            return AssignmentResponse.builder()
                    .id(assignment.getId())
                    .title(assignment.getTitle())
                    .description(assignment.getDescription())
                    .userId(assignment.getUserId())
                    .typeUmlName(assignment.getTypeUML().getName())
                    .classIds(classIds)
                    .isActive(assignment.getIsActive())
                    .assignmentCode(assignment.getAssignmentCode())
                    .createdDate(assignment.getCreatedDate())
                    .build();
        });
    }

    @Override
    public AssignmentResponse assignAssignment(AssignmentRequest request) {
        //TODO: Chua check classID
        try {
            identityServiceClient.getUser(request.getUserId());
        } catch (FeignException.NotFound ex) {
            throw new IllegalArgumentException("User not found with id: " + request.getUserId());
        }

        TypeUML typeUML = typeUMLRepository.findById(request.getTypeUmlId())
                .orElseThrow(() -> new NotFoundException("TypeUML not found"));

        Assignment assignment = Assignment.builder()
                .userId(request.getUserId())
                .title(request.getTitle())
                .description(request.getDescription())
                .typeUML(typeUML)
                .assignmentCode(request.getAssignmentCode())
                .build();

        assignmentRepository.save(assignment);

        List<AssignmentClass> assignmentClasses = request.getClassIds().stream()
                .map(classId -> AssignmentClass.builder()
                        .assignment(assignment)
                        .classId(classId)
                        .build())
                .toList();
        assignmentClassRepository.saveAll(assignmentClasses);

        return AssignmentResponse.builder()
                .id(assignment.getId())
                .title(assignment.getTitle())
                .description(assignment.getDescription())
                .userId(assignment.getUserId())
                .typeUmlName(assignment.getTypeUML().getName())
                .classIds(request.getClassIds())
                .isActive(assignment.getIsActive())
                .assignmentCode(assignment.getAssignmentCode())
                .createdDate(assignment.getCreatedDate())
                .build();
    }

    @Override
    public AssignmentResponse unassignAssignment(AssignmentRequest request) {
        //TODO: Chua check classID
        try {
            identityServiceClient.getUser(request.getUserId());
        } catch (FeignException.NotFound ex) {
            throw new IllegalArgumentException("User not found with id: " + request.getUserId());
        }

        Assignment assignment = assignmentRepository
                .findByUserIdAndTitleAndTypeUML_Id(request.getUserId(), request.getTitle(), request.getTypeUmlId())
                .orElseThrow(() -> new NotFoundException("Assignment not found"));

        List<AssignmentClass> assignmentClassesToDelete = assignmentClassRepository
                .findByAssignmentAndClassIdIn(assignment, request.getClassIds());

        assignmentClassRepository.deleteAll(assignmentClassesToDelete);

        return AssignmentResponse.builder()
                .id(assignment.getId())
                .title(assignment.getTitle())
                .description(assignment.getDescription())
                .userId(assignment.getUserId())
                .typeUmlName(assignment.getTypeUML().getName())
                .classIds(request.getClassIds())
                .isActive(assignment.getIsActive())
                .assignmentCode(assignment.getAssignmentCode())
                .createdDate(assignment.getCreatedDate())
                .build();
    }

    @Override
    public AssignmentResponse getAssignment(Long assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new NotFoundException("Assignment not found"));
        List<Long> classIds = assignmentClassRepository.findByAssignmentId(assignment.getId())
                .stream()
                .map(AssignmentClass::getClassId)
                .toList();
        return AssignmentResponse.builder()
                .id(assignment.getId())
                .title(assignment.getTitle())
                .description(assignment.getDescription())
                .userId(assignment.getUserId())
                .typeUmlName(assignment.getTypeUML().getName())
                .isActive(assignment.getIsActive())
                .assignmentCode(assignment.getAssignmentCode())
                .classIds(classIds)
                .createdDate(assignment.getCreatedDate())
                .build();
    }

    @Override
    public void deleteAssignment(Long assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new NotFoundException("Assignment not found"));
        assignment.setIsActive(-1);
        assignmentRepository.save(assignment);
    }

    @Override
    public AssignmentResponse toggleAssignmentStatus(Long assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new NotFoundException("Assignment not found with ID: " + assignmentId));
        Integer currentStatus = assignment.getIsActive();
        assignment.setIsActive(currentStatus != null && currentStatus == 1 ? 0 : 1);
        Assignment updatedAssignment = assignmentRepository.save(assignment);
        return AssignmentResponse.builder()
                .id(updatedAssignment.getId())
                .title(updatedAssignment.getTitle())
                .description(updatedAssignment.getDescription())
                .userId(updatedAssignment.getUserId())
                .isActive(updatedAssignment.getIsActive())
                .assignmentCode(updatedAssignment.getAssignmentCode())
                .typeUmlName(updatedAssignment.getTypeUML().getName())
                .createdDate(updatedAssignment.getCreatedDate())
                .classIds(assignmentClassRepository.findByAssignmentId(updatedAssignment.getId())
                        .stream()
                        .map(AssignmentClass::getClassId)
                        .toList())
                .build();
    }
}
