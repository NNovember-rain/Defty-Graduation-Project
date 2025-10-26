package com.defty.content_service.service.impl;

import com.defty.content_service.client.ClassServiceClient;
import com.defty.content_service.dto.request.AssignRequest;
import com.defty.content_service.dto.request.AssignmentRequest;
import com.defty.content_service.dto.request.ModuleRequest;
import com.defty.content_service.dto.response.AssignmentClassResponse;
import com.defty.content_service.dto.response.AssignmentResponse;
import com.defty.content_service.dto.response.ModuleResponse;
import com.defty.content_service.entity.Assignment;
import com.defty.content_service.entity.AssignmentClass;
import com.defty.content_service.entity.ModuleEntity;
import com.defty.content_service.entity.TypeUML;
import com.defty.content_service.exception.AppException;
import com.defty.content_service.exception.ErrorCode;
import com.defty.content_service.repository.AssignmentClassRepository;
import com.defty.content_service.repository.AssignmentRepository;
import com.defty.content_service.repository.TypeUMLRepository;
import com.defty.content_service.service.AssignmentService;
import com.defty.content_service.specification.AssignmentSpecification;
import com.example.common_library.exceptions.NotFoundException;
import com.example.common_library.utils.UserUtils;
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

import java.util.*;
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
        UserUtils.UserInfo currentUser = UserUtils.getCurrentUser();
        if (currentUser == null) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }
        Long userId = currentUser.userId();

        Assignment assignment = assignmentRepository
                .findByUserIdAndTitle(userId, request.getTitle())
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

    @Override
    public Map<Long, AssignmentResponse> getAssignmentsByIds(List<Long> assignmentIds) {
        if (assignmentIds == null || assignmentIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Assignment> assignments = assignmentRepository.findAllById(assignmentIds);

        return assignments.stream()
                .collect(Collectors.toMap(
                        Assignment::getId,
                        this::toAssignmentResponse
                ));
    }

    private Assignment createOrUpdateAssignment(Assignment assignment, AssignmentRequest request) {
        UserUtils.UserInfo currentUser = UserUtils.getCurrentUser();
        if (currentUser == null) {
            throw new IllegalArgumentException("Only instructors can upload materials.");
        }
        Long userId = currentUser.userId();

        assignment.setUserId(userId);
        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());

        if (request.getModules() == null || request.getModules().isEmpty()) {
            throw new IllegalArgumentException("Modules cannot be empty");
        }

        // Lấy TypeUML đầu tiên để sinh assignmentCode (nếu assignment mới)
        if (assignment.getAssignmentCode() == null || assignment.getAssignmentCode().isEmpty()) {
            ModuleRequest firstModuleReq = request.getModules().get(0);
            if (firstModuleReq.getTypeUmlIds() == null || firstModuleReq.getTypeUmlIds().isEmpty()) {
                throw new IllegalArgumentException("Module must have at least one TypeUML");
            }

            TypeUML firstTypeUML = typeUMLRepository.findById(firstModuleReq.getTypeUmlIds().get(0))
                    .orElseThrow(() -> new NotFoundException("TypeUML not found"));

            String prefix = firstTypeUML.getName().replaceAll("\\s+", "").chars()
                    .filter(Character::isUpperCase)
                    .mapToObj(c -> String.valueOf((char) c))
                    .collect(Collectors.joining());
            if (prefix.isEmpty()) {
                prefix = firstTypeUML.getName()
                        .substring(0, Math.min(firstTypeUML.getName().length(), 3))
                        .toUpperCase();
            }

            int randomNum = (int) (Math.random() * 90000) + 10000;
            assignment.setAssignmentCode(prefix + "-" + randomNum);
        }

        // 🧩 Xử lý modules
        if (assignment.getModules() == null) {
            assignment.setModules(new ArrayList<>());
        } else {
            assignment.getModules().clear(); // xóa modules cũ
        }

        for (ModuleRequest moduleReq : request.getModules()) {
            ModuleEntity module = new ModuleEntity();
            module.setModuleName(moduleReq.getModuleName());
            module.setModuleDescription(moduleReq.getModuleDescription());
            module.setSolutionCode(moduleReq.getSolutionCode());
            module.setAssignment(assignment);

            // Mapping TypeUMLs
            Set<TypeUML> typeUMLs = new HashSet<>();
            for (Long typeId : moduleReq.getTypeUmlIds()) {
                TypeUML typeUML = typeUMLRepository.findById(typeId)
                        .orElseThrow(() -> new NotFoundException("TypeUML not found: " + typeId));
                typeUMLs.add(typeUML);
            }
            module.setTypeUMLs(typeUMLs);

            assignment.getModules().add(module);
        }

        assignment = assignmentRepository.save(assignment);

        // Gán code cho từng module sau khi đã có ID
        for (ModuleEntity module : assignment.getModules()) {
            module.setModuleCode(assignment.getAssignmentCode() + "-" + module.getId());
        }

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

        List<ModuleResponse> moduleResponses = assignment.getModules() != null
                ? assignment.getModules().stream()
                .map(m -> ModuleResponse.builder()
                        .id(m.getId())
                        .moduleName(m.getModuleName())
                        .moduleDescription(m.getModuleDescription())
                        .solutionCode(m.getSolutionCode())
                        .typeUmlIds(
                                m.getTypeUMLs() != null
                                        ? m.getTypeUMLs().stream()
                                        .map(TypeUML::getId)
                                        .toList()
                                        : List.of()
                        )
                        .build())
                .toList()
                : List.of();

        return AssignmentResponse.builder()
                .id(assignment.getId())
                .title(assignment.getTitle())
                .commonDescription(assignment.getDescription())
                .userId(assignment.getUserId())
                .isActive(assignment.getIsActive())
                .assignmentCode(assignment.getAssignmentCode())
                .createdDate(assignment.getCreatedDate())
                .classIds(classIds)
                .assignmentClasses(assignmentClassResponses)
                .modules(moduleResponses)
                .build();
    }
}