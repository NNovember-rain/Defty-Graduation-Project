package com.defty.content_service.service.impl;

import com.defty.content_service.client.ClassServiceClient;
import com.defty.content_service.dto.request.AssignRequest;
import com.defty.content_service.dto.request.AssignmentRequest;
import com.defty.content_service.dto.response.AssignmentClassResponse;
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
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AssignmentServiceImpl implements AssignmentService {
    AssignmentRepository assignmentRepository;
    AssignmentClassRepository assignmentClassRepository;
    TypeUMLRepository typeUMLRepository;
    ClassServiceClient classServiceClient;

    @Override
    public Page<AssignmentResponse> getAllAssignments(Long classId, Long typeUmlId, String title, Pageable pageable) {
        if (classId != null) {
            try {
                classServiceClient.getClassById(classId);
            } catch (FeignException.NotFound ex) {
                throw new IllegalArgumentException("Class not found with id: " + classId);
            }
        }

        Specification<Assignment> spec = Specification.where(AssignmentSpecification.hasTypeUmlId(typeUmlId))
                .and(AssignmentSpecification.hasTitleLike(title))
                .and(AssignmentSpecification.hasClassId(classId))
                .and(AssignmentSpecification.isActiveOnly());

        Page<Assignment> assignments = assignmentRepository.findAll(spec, pageable);
        return assignments.map(this::toAssignmentResponse);
    }

    @Override
    public List<AssignmentResponse> assignAssignment(AssignRequest assignRequest) {
        validateClassIds(assignRequest.getClassIds());

        List<Assignment> assignments = assignmentRepository.findAllById(assignRequest.getAssignmentIds());
        if (assignments.isEmpty()) {
            throw new IllegalArgumentException("No assignments found for given ids");
        }

        List<AssignmentClass> existingAssignmentClasses = assignmentClassRepository
                .findByAssignmentIdInAndClassIdIn(assignRequest.getAssignmentIds(), assignRequest.getClassIds());

        if (!existingAssignmentClasses.isEmpty()) {
            throw new IllegalArgumentException("Assignments already assigned to the specified classes");
        }

        List<AssignmentClass> assignmentClasses = assignments.stream()
                .flatMap(assignment -> assignRequest.getClassIds().stream()
                        .map(classId -> AssignmentClass.builder()
                                .assignment(assignment)
                                .classId(classId)
                                .endDate(assignRequest.getEndDate())
                                .startDate(assignRequest.getStartDate())
                                .build()))
                .collect(Collectors.toList());

        assignmentClassRepository.saveAll(assignmentClasses);

        return assignments.stream()
                .map(this::toAssignmentResponse)
                .collect(Collectors.toList());
    }

    @Override
    public AssignmentResponse unassignAssignment(AssignmentRequest request) {
        validateClassIds(request.getClassIds());

        Assignment assignment = assignmentRepository
                .findByUserIdAndTitleAndTypeUML_Id(request.getUserId(), request.getTitle(), request.getTypeUmlId())
                .orElseThrow(() -> new NotFoundException("Assignment not found"));

        List<AssignmentClass> assignmentClassesToDelete = assignmentClassRepository
                .findByAssignmentAndClassIdIn(assignment, request.getClassIds());

        assignmentClassRepository.deleteAll(assignmentClassesToDelete);

        return toAssignmentResponse(assignment);
    }

    @Override
    public AssignmentResponse getAssignment(Long assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new NotFoundException("Assignment not found"));
        return toAssignmentResponse(assignment);
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
        return toAssignmentResponse(updatedAssignment);
    }

    @Override
    public Page<AssignmentResponse> getAssignmentsByClassId(Long classId, Pageable pageable) {
        try {
            classServiceClient.getClassById(classId);
        } catch (FeignException.NotFound ex) {
            throw new IllegalArgumentException("Class not found with id: " + classId);
        }

        List<Assignment> assignments = assignmentClassRepository.findByClassId(classId)
                .stream()
                .map(assignmentClass -> assignmentRepository.findById(assignmentClass.getAssignment().getId())
                        .orElseThrow(() -> new NotFoundException("Assignment not found with ID: " + assignmentClass.getAssignment().getId())))
                .filter(assignment -> assignment.getIsActive() != null && assignment.getIsActive() == 1)
                .toList();

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), assignments.size());
        List<AssignmentResponse> responses = assignments.subList(start, end)
                .stream()
                .map(this::toAssignmentResponse)
                .collect(Collectors.toList());

        return new PageImpl<>(responses, pageable, assignments.size());
    }

    @Override
    public AssignmentResponse createAssignment(AssignmentRequest request) {
        Assignment assignment = createOrUpdateAssignment(new Assignment(), request);
        return toAssignmentResponse(assignment);
    }

    @Override
    public AssignmentResponse updateAssignment(Long id, AssignmentRequest request) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Assignment not found with ID: " + id));
        Assignment updatedAssignment = createOrUpdateAssignment(assignment, request);
        return toAssignmentResponse(updatedAssignment);
    }

    private Assignment createOrUpdateAssignment(Assignment assignment, AssignmentRequest request) {
        TypeUML typeUML = typeUMLRepository.findById(request.getTypeUmlId())
                .orElseThrow(() -> new NotFoundException("TypeUML not found"));

        String prefix = typeUML.getName().replaceAll("\\s+", "").chars()
                .filter(c -> Character.isUpperCase(c))
                .mapToObj(c -> String.valueOf((char) c))
                .collect(Collectors.joining());

        if (prefix.isEmpty()) {
            prefix = typeUML.getName().substring(0, Math.min(typeUML.getName().length(), 3)).toUpperCase();
        }

        int randomNum = (int) (Math.random() * 90000) + 10000;
        String assignmentCode = prefix + "-" + randomNum;

        assignment.setUserId(request.getUserId());
        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        assignment.setTypeUML(typeUML);
        assignment.setAssignmentCode(assignmentCode);
        assignment.setSolutionCode(request.getSolutionCode());
        return assignmentRepository.save(assignment);
    }

    private void validateClassIds(List<Long> classIds) {
        if (classIds != null) {
            classIds.forEach(classId -> {
                try {
                    classServiceClient.getClassById(classId);
                } catch (FeignException.NotFound ex) {
                    throw new IllegalArgumentException("Class not found with id: " + classId);
                }
            });
        }
    }

    private AssignmentResponse toAssignmentResponse(Assignment assignment) {
        List<AssignmentClass> assignmentClasses = assignmentClassRepository.findByAssignmentId(assignment.getId());

        List<Long> classIds = assignmentClasses.stream()
                .map(AssignmentClass::getClassId)
                .toList();

        List<AssignmentClassResponse> assignmentClassResponses = assignmentClasses.stream()
                .map(ac -> AssignmentClassResponse.builder()
                        .id(ac.getId())
                        .classId(ac.getClassId())
                        .assignmentId(ac.getAssignment().getId())
                        .startDate(ac.getStartDate())
                        .endDate(ac.getEndDate())
                        .build())
                .toList();

        return AssignmentResponse.builder()
                .id(assignment.getId())
                .title(assignment.getTitle())
                .description(assignment.getDescription())
                .userId(assignment.getUserId())
                .typeUmlName(assignment.getTypeUML() != null ? assignment.getTypeUML().getName() : null)
                .isActive(assignment.getIsActive())
                .assignmentCode(assignment.getAssignmentCode())
                .createdDate(assignment.getCreatedDate())
                .solutionCode(assignment.getSolutionCode())
                .classIds(classIds)
                .assignmentClasses(assignmentClassResponses)
                .build();
    }

}