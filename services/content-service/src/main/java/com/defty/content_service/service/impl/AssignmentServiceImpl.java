package com.defty.content_service.service.impl;

import com.defty.content_service.dto.request.AssignmentRequest;
import com.defty.content_service.dto.response.AssignmentResponse;
import com.defty.content_service.entity.Assignment;
import com.defty.content_service.entity.AssignmentClass;
import com.defty.content_service.entity.TypeUML;
import com.defty.content_service.repository.AssignmentClassRepository;
import com.defty.content_service.repository.AssignmentRepository;
import com.defty.content_service.repository.TypeUMLRepository;
import com.defty.content_service.service.AssignmentService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AssignmentServiceImpl implements AssignmentService {
    AssignmentRepository assignmentRepository;
    AssignmentClassRepository assignmentClassRepository;
    TypeUMLRepository typeUMLRepository;

    @Override
    public AssignmentResponse createAssignment(AssignmentRequest request) {
        TypeUML typeUML = typeUMLRepository.findById(request.getTypeUmlId())
                .orElseThrow(() -> new RuntimeException("TypeUML not found"));

        Assignment assignment = Assignment.builder()
                .userId(request.getUserId())
                .title(request.getTitle())
                .description(request.getDescription())
                .typeUML(typeUML)
                .build();

        assignmentRepository.save(assignment);

        // Giao bài cho từng lớp
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
                .typeUmlId(assignment.getTypeUML().getId())
                .classIds(request.getClassIds())
                .build();
    }
}
