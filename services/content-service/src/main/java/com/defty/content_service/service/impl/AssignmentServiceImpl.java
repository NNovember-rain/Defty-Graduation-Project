package com.defty.content_service.service.impl;

import com.defty.content_service.client.ClassServiceClient;
import com.defty.content_service.dto.request.*;
import com.defty.content_service.dto.response.*;
import com.defty.content_service.entity.*;
import com.defty.content_service.enums.TypeUml;
import com.defty.content_service.exception.AppException;
import com.defty.content_service.exception.ErrorCode;
import com.defty.content_service.repository.*;
import com.defty.content_service.service.AssignmentService;
import com.defty.content_service.specification.AssignmentSpecification;
import com.example.common_library.exceptions.NotFoundException;
import com.example.common_library.utils.UserUtils;
import feign.FeignException;
import jakarta.transaction.Transactional;
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
class AssignmentServiceImpl implements AssignmentService {
    AssignmentRepository assignmentRepository;
    AssignmentClassRepository assignmentClassRepository;
    ClassServiceClient classServiceClient;
    ModuleRepository moduleRepository;
    ModuleSolutionRepository moduleSolutionRepository;
    AssignmentClassDetailRepository assignmentClassDetailRepository;

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
    public Page<AssignmentResponse> getUnassignedAssignments(Long classId, String mode, Pageable pageable) {
        Page<Assignment> allAssignmentsPage = assignmentRepository.findAllActiveAssignments(pageable);
        List<AssignmentClass> assignmentClasses = assignmentClassRepository.findByClassId(classId);
        boolean check = mode.equalsIgnoreCase("test");

        Set<Long> assignmentClassIds = assignmentClasses.stream()
                .map(AssignmentClass::getId)
                .collect(Collectors.toSet());

        List<AssignmentClassDetail> allDetails = assignmentClassDetailRepository.findAllByAssignmentClassIdInAndChecked(assignmentClassIds, check);
        Set<Long> assignedModuleIds = allDetails.stream()
                .map(AssignmentClassDetail::getModule)
                .map(ModuleEntity::getId)
                .collect(Collectors.toSet());

        List<AssignmentResponse> filteredResponses = new ArrayList<>();

        for (Assignment assignment : allAssignmentsPage.getContent()) {
            List<ModuleEntity> assignmentModules = assignment.getModules();

            List<ModuleEntity> unassignedModules = assignmentModules != null ?
                    assignmentModules.stream()
                            .filter(module -> !assignedModuleIds.contains(module.getId()))
                            .toList()
                    : List.of();

            if (!unassignedModules.isEmpty()) {
                AssignmentResponse response = toAssignmentResponseCheck(assignment, unassignedModules);
                filteredResponses.add(response);
            }
        }

        return new PageImpl<>(
                filteredResponses,
                pageable,
                allAssignmentsPage.getTotalElements()
        );
    }

    @Override
    public List<AssignmentResponse> assignAssignment(AssignRequest assignRequest) {
        validateClassIds(assignRequest.getClassIds());
        List<AssignmentResponse> responses = new ArrayList<>();

        for (AssignmentAssignRequest assignmentReq : assignRequest.getAssignments()) {
            Long assignmentId = assignmentReq.getAssignmentId();
            Assignment assignment = assignmentRepository.findById(assignmentId)
                    .orElseThrow(() -> new NotFoundException("Assignment not found with id: " + assignmentId));

            for (Long classId : assignRequest.getClassIds()) {
                AssignmentClass assignmentClass = assignmentClassRepository
                        .findByAssignmentIdAndClassId(assignmentId, classId)
                        .orElseGet(() -> {
                            AssignmentClass newClass = AssignmentClass.builder()
                                    .assignment(assignment)
                                    .classId(classId)
                                    .build();
                            return assignmentClassRepository.save(newClass);
                        });

                if (assignmentReq.getModules() != null && !assignmentReq.getModules().isEmpty()) {
                    for (ModuleAssignRequest moduleReq : assignmentReq.getModules()) {
                        ModuleEntity module = moduleRepository.findById(moduleReq.getModuleId())
                                .orElseThrow(() -> new NotFoundException(
                                        "Module not found with id: " + moduleReq.getModuleId()
                                ));

                        if (moduleReq.getTypeUmls() != null && !moduleReq.getTypeUmls().isEmpty()) {
                            for (String typeName : moduleReq.getTypeUmls()) {
                                TypeUml type;
                                try {
                                    type = TypeUml.valueOf(typeName);
                                } catch (IllegalArgumentException e) {
                                    throw new AppException(ErrorCode.INVALID_TYPE_UML);
                                }

                                boolean exists = assignmentClass.getAssignmentClassDetails() != null &&
                                        assignmentClass.getAssignmentClassDetails().stream()
                                                .anyMatch(d ->
                                                        d.getModule().getId().equals(module.getId())
                                                                && d.getTypeUml() == type
                                                );

                                if (!exists) {
                                    AssignmentClassDetail detail = AssignmentClassDetail.builder()
                                            .assignmentClass(assignmentClass)
                                            .module(module)
                                            .typeUml(type)
                                            .startDate(assignmentReq.getStartDate())
                                            .endDate(assignmentReq.getEndDate())
                                            .checked(true)
                                            .build();
                                    assignmentClassDetailRepository.save(detail);
                                }
                            }
                        } else {
                            boolean exists = assignmentClass.getAssignmentClassDetails() != null &&
                                    assignmentClass.getAssignmentClassDetails().stream()
                                            .anyMatch(d -> d.getModule().getId().equals(module.getId())
                                                    && d.getTypeUml() == null);

                            if (!exists) {
                                AssignmentClassDetail detail = AssignmentClassDetail.builder()
                                        .assignmentClass(assignmentClass)
                                        .module(module)
                                        .typeUml(null)
                                        .checked(false)
                                        .startDate(assignmentReq.getStartDate())
                                        .endDate(assignmentReq.getEndDate())
                                        .build();
                                assignmentClassDetailRepository.save(detail);
                            }
                        }
                    }
                }
            }

            responses.add(toAssignmentResponse(assignment));
        }

        return responses;
    }

    @Override
    public void unassignAssignment(Long assignmentClassDetailId) {
        Optional<AssignmentClassDetail> detail = assignmentClassDetailRepository.findById(assignmentClassDetailId);
        if (detail.isPresent()) {
            assignmentClassDetailRepository.delete(detail.get());
        } else {
            throw new NotFoundException("AssignmentClassDetail not found with id: " + assignmentClassDetailId);
        }
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
    public Page<AssignmentClassResponse> getAssignmentsByClassId(Long classId, Pageable pageable) {
        List<AssignmentClass> assignmentClasses = assignmentClassRepository.findAllByClassIdFetch(classId, pageable);
        long total = assignmentClassRepository.countByClassId(classId);

        List<AssignmentClassResponse> responses = assignmentClasses.stream()
                .map(ac -> {
                    Assignment assignment = ac.getAssignment();

                    Map<Long, Map<Boolean, List<AssignmentClassDetail>>> groupedByModuleAndChecked = ac.getAssignmentClassDetails().stream()
                            .collect(Collectors.groupingBy(
                                    detail -> detail.getModule().getId(),
                                    Collectors.groupingBy(AssignmentClassDetail::isChecked)
                            ));

                    List<AssignmentClassDetailsResponse> moduleResponses = new ArrayList<>();

                    groupedByModuleAndChecked.forEach((moduleId, checkedMap) -> {
                        ModuleEntity module = ac.getAssignmentClassDetails().stream()
                                .filter(d -> d.getModule().getId().equals(moduleId))
                                .findFirst()
                                .map(AssignmentClassDetail::getModule)
                                .orElse(null);

                        if (module == null) return;

                        checkedMap.forEach((isChecked, details) -> {

                            if (isChecked) {
                                details.forEach(detail -> {
                                    List<String> singleTypeUmlList = new ArrayList<>();

                                    String typeUmlName = detail.getTypeUml() != null ? detail.getTypeUml().name() : "NO_TYPE";
                                    singleTypeUmlList.add(typeUmlName);

                                    AssignmentClassDetailsResponse response = AssignmentClassDetailsResponse.builder()
                                            .moduleId(moduleId)
                                            .moduleName(module.getModuleName())
                                            .moduleDescription(module.getModuleDescription())
                                            .typeUmls(singleTypeUmlList)
                                            .checkedTest(true)
                                            .assignmentClassDetailId(detail.getId())
                                            .startDate(detail.getStartDate())
                                            .endDate(detail.getEndDate())
                                            .build();
                                    moduleResponses.add(response);
                                });

                            } else {
                                List<String> typeUmls = details.stream()
                                        .map(detail -> detail.getTypeUml() != null ? detail.getTypeUml().name() : "NO_TYPE")
                                        .toList();

                                AssignmentClassDetail firstDetail = details.stream().findFirst().orElse(null);

                                AssignmentClassDetailsResponse response = AssignmentClassDetailsResponse.builder()
                                        .moduleId(moduleId)
                                        .moduleName(module.getModuleName())
                                        .moduleDescription(module.getModuleDescription())
                                        .typeUmls(typeUmls)
                                        .checkedTest(false)
                                        .assignmentClassDetailId(firstDetail != null ? firstDetail.getId() : null)
                                        .startDate(firstDetail != null ? firstDetail.getStartDate() : null)
                                        .endDate(firstDetail != null ? firstDetail.getEndDate() : null)
                                        .build();

                                moduleResponses.add(response);
                            }
                        });
                    });

                    return AssignmentClassResponse.builder()
                            .assignmentId(assignment.getId())
                            .assignmentTitle(assignment.getTitle())
                            .assignmentDescription(assignment.getDescription())
                            .assignmentCode(assignment.getAssignmentCode())
                            .startDate(assignment.getStartDate())
                            .classId(classId)
                            .endDate(assignment.getEndDate())
                            .assignmentClassId(ac.getId())
                            .assignmentClassDetailResponseList(moduleResponses)
                            .build();
                })
                .toList();

        return new PageImpl<>(responses, pageable, total);
    }

    @Override
    public AssignmentClassResponse getAssignmentByClassId(Long classId, Long assignmentId) {
        AssignmentClass assignmentClass = assignmentClassRepository
                .findByAssignmentIdAndClassId(assignmentId, classId)
                .orElseThrow(() -> new NotFoundException(
                        "Assignment with id " + assignmentId + " not found in class " + classId));

        Assignment assignment = assignmentClass.getAssignment();

        Map<Long, List<String>> moduleUmlMap = assignmentClass.getAssignmentClassDetails().stream()
                .collect(Collectors.groupingBy(
                        detail -> detail.getModule().getId(),
                        Collectors.mapping(detail -> detail.getTypeUml() != null
                                        ? detail.getTypeUml().name()
                                        : "NO_TYPE",
                                Collectors.toList())
                ));

        List<AssignmentClassDetailsResponse> moduleResponses = moduleUmlMap.entrySet().stream()
                .map(entry -> {
                    ModuleEntity module = assignmentClass.getAssignmentClassDetails().stream()
                            .filter(d -> d.getModule().getId().equals(entry.getKey()))
                            .findFirst()
                            .map(AssignmentClassDetail::getModule)
                            .orElse(null);

                    return AssignmentClassDetailsResponse.builder()
                            .moduleId(module.getId())
                            .moduleName(module.getModuleName())
                            .moduleDescription(module.getModuleDescription())
                            .typeUmls(entry.getValue())
                            .build();
                })
                .toList();

        return AssignmentClassResponse.builder()
                .assignmentId(assignment.getId())
                .assignmentTitle(assignment.getTitle())
                .assignmentDescription(assignment.getDescription())
                .assignmentCode(assignment.getAssignmentCode())
                .startDate(assignment.getStartDate())
                .endDate(assignment.getEndDate())
                .assignmentClassDetailResponseList(moduleResponses)
                .build();
    }

    @Override
    public AssignmentClassResponse getAssignmentClassDetailId(Long assignmentClassDetailId) {
        Optional<AssignmentClassDetail> detailOptional = assignmentClassDetailRepository.findById(assignmentClassDetailId);
        if (detailOptional.isEmpty()) {
            return null;
        }
        AssignmentClassDetail assignmentClassDetail = detailOptional.get();

        return AssignmentClassResponse.builder()
                .assignmentId(assignmentClassDetail.getAssignmentClass().getAssignment().getId())
                .assignmentTitle(assignmentClassDetail.getAssignmentClass().getAssignment().getTitle())
                .assignmentDescription(assignmentClassDetail.getAssignmentClass().getAssignment().getDescription())
                .assignmentDescriptionHtml(assignmentClassDetail.getAssignmentClass().getAssignment().getDescriptionHtml())
                .assignmentCode(assignmentClassDetail.getAssignmentClass().getAssignment().getAssignmentCode())
                .startDate(assignmentClassDetail.getStartDate())
                .endDate(assignmentClassDetail.getEndDate())
                .checkedTest(assignmentClassDetail.isChecked())
                .classId(assignmentClassDetail.getAssignmentClass().getClassId())
                .assignmentClassDetailResponseList(List.of(
                        AssignmentClassDetailsResponse.builder()
                                .moduleId(assignmentClassDetail.getModule().getId())
                                .moduleName(assignmentClassDetail.getModule().getModuleName())
                                .moduleDescription(assignmentClassDetail.getModule().getModuleDescription())
                                .moduleDescriptionHtml(assignmentClassDetail.getModule().getModuleDescriptionHtml())
                                .typeUmls(List.of(
                                        assignmentClassDetail.getTypeUml() != null
                                                ? assignmentClassDetail.getTypeUml().name()
                                                : "NO_TYPE"
                                ))
                                .assignmentClassDetailId(assignmentClassDetail.getId())
                                .checkedTest(assignmentClassDetail.isChecked())
                                .startDate(assignmentClassDetail.getStartDate())
                                .endDate(assignmentClassDetail.getEndDate())
                                .build()
                ))
                .build();
    }

    @Override
    public AssignmentResponseByClass getAssignmentAllModule(Long assignmentClassId) {
        AssignmentClass assignmentClass = assignmentClassRepository.findById(assignmentClassId)
                .orElseThrow(() -> new NotFoundException("Assignment class not found"));
        List<AssignmentClassDetail> details =
                assignmentClassDetailRepository.findAllByAssignmentClassIdAndChecked(assignmentClassId, false);

        List<ModuleResponse> moduleResponses = details.stream()
                .map(detail -> {

                    ModuleEntity m = detail.getModule();

                    return ModuleResponse.builder()
                            .id(m.getId())
                            .moduleName(m.getModuleName())
                            .moduleDescription(m.getModuleDescription())
                            .moduleDescriptionHtml(m.getModuleDescriptionHtml())
                            .assignmentClassDetailId(detail.getId())
                            .build();
                })
                .toList();

        Assignment assignment = assignmentClass.getAssignment();

        return AssignmentResponseByClass.builder()
                .assignmentDescription(assignment.getDescription())
                .assignmentDescriptionHtml(assignment.getDescriptionHtml())
                .assignmentTitle(assignment.getTitle())
                .modules(moduleResponses)
                .build();
    }

    @Override
    public AssignmentClassDetailResponse getAssignmentClassDetail(Long assignmentClassDetailId, String typeUml, Long moduleId) {
        AssignmentClassDetail assignmentClassDetail = assignmentClassDetailRepository.findById(assignmentClassDetailId)
                .orElseThrow(() -> new NotFoundException("AssignmentClassDetail not found with id: " + assignmentClassDetailId));
        AssignmentClass assignmentClass = assignmentClassDetail.getAssignmentClass();
        Assignment assignment = assignmentClass.getAssignment();
        ModuleEntity module;
        if(moduleId != null){
            module = moduleRepository.findById(moduleId)
                    .orElseThrow(() -> new NotFoundException("Module not found with id: " + moduleId));
        }
        else{
            Long moduleIdDB = assignmentClassDetail.getModule().getId();
            module = moduleRepository.findById(moduleIdDB)
                    .orElseThrow(() -> new NotFoundException("Module not found with id: " + moduleIdDB));
        }
        ModuleSolution moduleSolution;
        String solutionCode;
        if(typeUml != null){
            moduleSolution = moduleSolutionRepository.findByModuleAndTypeUml(module, TypeUml.valueOf(typeUml));
        }
        else{
            moduleSolution = null;
        }
        solutionCode = (moduleSolution != null) ? moduleSolution.getSolutionCode() : null;

        return AssignmentClassDetailResponse.builder()
                .moduleId(module.getId())
                .assignmentId(assignment.getId())
                .assignmentDescription(assignmentClassDetail.getAssignmentClass().getAssignment().getDescription())
                .assignmentDescriptionHtml(assignmentClassDetail.getAssignmentClass().getAssignment().getDescriptionHtml())
                .titleAssignment(assignmentClassDetail.getAssignmentClass().getAssignment().getTitle())
                .moduleName(assignmentClassDetail.getModule().getModuleName())
                .moduleDescription(assignmentClassDetail.getModule().getModuleDescription())
                .typeUml(String.valueOf(assignmentClassDetail.getTypeUml()))
                .solutionCode(solutionCode)
                .checkedTest(assignmentClassDetail.isChecked())
                .startDate(assignmentClassDetail.getStartDate())
                .endDate(assignmentClassDetail.getEndDate())
                .build();
    }

    @Override
    public Map<Long, ModuleResponse> getModulesByIds(List<Long> moduleIds) {
        List<ModuleEntity> moduleEntities = moduleRepository.findAllById(moduleIds);
        return moduleEntities.stream()
                .collect(Collectors.toMap(
                        ModuleEntity::getId,
                        m -> ModuleResponse.builder()
                                .id(m.getId())
                                .moduleName(m.getModuleName())
                                .moduleDescription(m.getModuleDescription())
                                .moduleDescriptionHtml(m.getModuleDescriptionHtml())
                                .build()
                ));
    }


    @Override
    public AssignmentResponse createAssignment(AssignmentRequest request) {
        UserUtils.UserInfo currentUser = UserUtils.getCurrentUser();
        if (currentUser == null) {
            throw new IllegalArgumentException("Only instructors can upload materials.");
        }
        Long userId = currentUser.userId();

        Assignment assignment = Assignment.builder()
                .userId(userId)
                .title(request.getTitle())
                .description(request.getDescription())
                .descriptionHtml(request.getDescriptionHtml())
                .assignmentCode(assignmentCode())
                .build();

        Assignment savedAssignment = assignmentRepository.save(assignment);

        List<ModuleRequest> moduleRequests = request.getModules();
        if (moduleRequests != null && !moduleRequests.isEmpty()) {
            for (ModuleRequest moduleRequest : moduleRequests) {
                ModuleEntity module = ModuleEntity.builder()
                        .moduleCode(assignmentCode())
                        .moduleName(moduleRequest.getModuleName())
                        .moduleDescription(moduleRequest.getModuleDescriptionHtml())
                        .moduleDescriptionHtml(moduleRequest.getModuleDescription())
                        .assignment(savedAssignment)
                        .build();

                ModuleEntity savedModule = moduleRepository.save(module);

                List<SolutionRequest> solutionRequests = moduleRequest.getSolutions();
                if (solutionRequests != null && !solutionRequests.isEmpty()) {
                    List<ModuleSolution> solutions = new ArrayList<>();
                    for (SolutionRequest solReq : solutionRequests) {
                        TypeUml type;
                        try {
                            type = TypeUml.valueOf(solReq.getTypeUml());
                        } catch (IllegalArgumentException e) {
                            throw new AppException(ErrorCode.INVALID_TYPE_UML);
                        }

                        ModuleSolution solution = ModuleSolution.builder()
                                .solutionCode(solReq.getSolutionCode())
                                .typeUml(type)
                                .module(savedModule)
                                .build();
                        solutions.add(solution);
                    }
                    moduleSolutionRepository.saveAll(solutions);
                }
            }
        }
        return toAssignmentResponse(savedAssignment);
    }


    @Override
    @Transactional
    public AssignmentResponse updateAssignment(Long id, AssignmentRequest request) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Assignment not found with id: " + id));

        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        assignment.setDescriptionHtml(request.getDescriptionHtml());
        assignmentRepository.save(assignment);

        List<ModuleRequest> moduleRequests = request.getModules();
        List<ModuleEntity> existingModules = moduleRepository.findByAssignmentId(assignment.getId());

        Set<String> incomingModuleNames = moduleRequests != null
                ? moduleRequests.stream().map(ModuleRequest::getModuleName).collect(Collectors.toSet())
                : Collections.emptySet();

        List<ModuleEntity> modulesToDelete = existingModules.stream()
                .filter(m -> !incomingModuleNames.contains(m.getModuleName()))
                .toList();

        if (!modulesToDelete.isEmpty()) {
            List<Long> moduleIdsToDelete = modulesToDelete.stream()
                    .map(ModuleEntity::getId)
                    .toList();
            List<ModuleSolution> solutionsToDelete = moduleSolutionRepository.findByModuleIdIn(moduleIdsToDelete);
            moduleSolutionRepository.deleteAll(solutionsToDelete);
            moduleRepository.deleteAll(modulesToDelete);
        }

        if (moduleRequests != null) {
            for (ModuleRequest moduleRequest : moduleRequests) {
                ModuleEntity module = existingModules.stream()
                        .filter(m -> m.getModuleName().equals(moduleRequest.getModuleName()))
                        .findFirst()
                        .orElseGet(() -> ModuleEntity.builder()
                                .moduleCode(assignmentCode())
                                .assignment(assignment)
                                .build());

                module.setModuleName(moduleRequest.getModuleName());
                module.setModuleDescription(moduleRequest.getModuleDescription());
                module.setModuleDescriptionHtml(moduleRequest.getModuleDescriptionHtml());
                ModuleEntity savedModule = moduleRepository.save(module);

                // --- 3️⃣ Xử lý solution ---
                List<SolutionRequest> solutionRequests = moduleRequest.getSolutions();
                List<ModuleSolution> existingSolutions = moduleSolutionRepository.findByModuleId(savedModule.getId());

                Set<TypeUml> incomingTypes = solutionRequests != null
                        ? solutionRequests.stream()
                        .map(sol -> {
                            try {
                                return TypeUml.valueOf(sol.getTypeUml());
                            } catch (IllegalArgumentException e) {
                                throw new AppException(ErrorCode.INVALID_TYPE_UML);
                            }
                        })
                        .collect(Collectors.toSet())
                        : Collections.emptySet();

                List<ModuleSolution> toDelete = existingSolutions.stream()
                        .filter(s -> !incomingTypes.contains(s.getTypeUml()))
                        .toList();
                moduleSolutionRepository.deleteAll(toDelete);

                if (solutionRequests != null) {
                    for (SolutionRequest solReq : solutionRequests) {
                        TypeUml type;
                        try {
                            type = TypeUml.valueOf(solReq.getTypeUml());
                        } catch (IllegalArgumentException e) {
                            throw new AppException(ErrorCode.INVALID_TYPE_UML);
                        }

                        ModuleSolution solution = existingSolutions.stream()
                                .filter(s -> s.getTypeUml() == type)
                                .findFirst()
                                .orElseGet(() -> ModuleSolution.builder()
                                        .module(savedModule)
                                        .typeUml(type)
                                        .build());

                        solution.setSolutionCode(solReq.getSolutionCode());
                        moduleSolutionRepository.save(solution);
                    }
                }
            }
        }

        return toAssignmentResponse(assignment);
    }

    @Override
    public Map<Long, AssignmentResponse> getAssignmentsByIds(List<Long> assignmentIds) {
        return Map.of();
    }

    @Override
    public ModuleResponse getAssignmentModule(Long moduleId) {
        return null;
    }

    private String assignmentCode(){
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < 5; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }

        int randomNum = (int) (Math.random() * 90000) + 10000;
        return sb + "-" + randomNum;
    }

    private AssignmentResponse toAssignmentResponseCheck(Assignment assignment, List<ModuleEntity> modulesToInclude) {
        List<ModuleResponse> moduleResponses = modulesToInclude != null
                ? modulesToInclude.stream()
                .map(m -> ModuleResponse.builder()
                        .id(m.getId())
                        .moduleName(m.getModuleName())
                        .moduleDescription(m.getModuleDescription())
                        .moduleDescriptionHtml(m.getModuleDescriptionHtml())
                        .build())
                .toList()
                : List.of();

        List<AssignmentClass> assignmentClasses = assignmentClassRepository.findByAssignmentId(assignment.getId());
        List<Long> classIds = assignmentClasses.stream()
                .map(AssignmentClass::getClassId)
                .toList();

        return AssignmentResponse.builder()
                .id(assignment.getId())
                .title(assignment.getTitle())
                .commonDescription(assignment.getDescription())
                .commonDescriptionHtml(assignment.getDescriptionHtml())
                .isActive(assignment.getIsActive())
                .assignmentCode(assignment.getAssignmentCode())
                .classIds(classIds)
                .modules(moduleResponses)
                .build();
    }

    private AssignmentResponse toAssignmentResponse(Assignment assignment) {
        List<AssignmentClass> assignmentClasses = assignmentClassRepository.findByAssignmentId(assignment.getId());

        List<Long> classIds = assignmentClasses.stream()
                .map(AssignmentClass::getClassId)
                .toList();

        List<ModuleResponse> moduleResponses = assignment.getModules() != null
                ? assignment.getModules().stream()
                .map(m -> {
                    List<SolutionResponse> solutionResponses = m.getModuleSolutions() != null
                            ? m.getModuleSolutions().stream()
                            .map(s -> SolutionResponse.builder()
                                    .id(s.getId())
                                    .solutionCode(s.getSolutionCode())
                                    .typeUml(s.getTypeUml() != null ? s.getTypeUml().name() : null)
                                    .build())
                            .toList()
                            : List.of();

                    return ModuleResponse.builder()
                            .id(m.getId())
                            .moduleName(m.getModuleName())
                            .moduleDescription(m.getModuleDescription())
                            .moduleDescriptionHtml(m.getModuleDescriptionHtml())
                            .solutionResponses(solutionResponses)
                            .build();
                })
                .toList()
                : List.of();


        return AssignmentResponse.builder()
                .id(assignment.getId())
                .title(assignment.getTitle())
                .commonDescription(assignment.getDescription())
                .commonDescriptionHtml(assignment.getDescriptionHtml())
                .userId(assignment.getUserId())
                .isActive(assignment.getIsActive())
                .assignmentCode(assignment.getAssignmentCode())
                .createdDate(assignment.getCreatedDate())
                .classIds(classIds)
                .modules(moduleResponses)
                .build();
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
}