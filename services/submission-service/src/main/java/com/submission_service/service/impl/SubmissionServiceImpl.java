package com.submission_service.service.impl;


import com.example.common_library.exceptions.FeignClientException;
import com.example.common_library.exceptions.FieldRequiredException;
import com.example.common_library.exceptions.NotFoundException;
import com.example.common_library.response.ApiResponse;
import com.example.common_library.utils.GetTokenUtil;
import com.example.common_library.utils.UserUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.submission_service.client.AuthServiceClient;
import com.submission_service.client.ClassManagementServiceClient;
import com.submission_service.client.ContentServiceClient;
import com.submission_service.mapper.SubmissionMapper;
import com.submission_service.model.dto.request.SubmissionRequest;
import com.submission_service.model.dto.response.*;
import com.submission_service.model.entity.Submission;
import com.submission_service.model.event.SubmissionEvent;
import com.submission_service.repository.ISubmissionRepository;
import com.submission_service.repository.specification.SubmissionSpecification;
import com.submission_service.service.IActionScheduler;
import com.submission_service.service.SubmissionService;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.kafka.KafkaException;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Getter
@Setter
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Service
public class SubmissionServiceImpl implements SubmissionService {
    RestTemplate restTemplate;
    ISubmissionRepository submissionRepository;
    ObjectMapper objectMapper;
    ModelMapper modelMapper;
    ContentServiceClient contentServiceClient;
    AuthServiceClient authServiceClient;
    ClassManagementServiceClient classManagementServiceClient;
    IActionScheduler actionScheduler;
    SubmissionMapper submissionMapper;


    @NonFinal
    @Value("${PLANTUML_SERVER_URL}")
    String PLANTUML_SERVER_URL;
    KafkaTemplate<String, Object> kafkaTemplate;

    @Override
    public Long handleSubmission(SubmissionRequest submissionRequest) {
        if (submissionRequest == null || submissionRequest.getStudentPlantUmlCode() == null || submissionRequest.getStudentPlantUmlCode().isBlank()) {
            throw new FieldRequiredException("Please provide a student plant UML code");
        }
        UserUtils.UserInfo currentUser = UserUtils.getCurrentUser();
        Long userId = currentUser.userId();
        log.info("Get userId from context");

        AssignmentResponse assignmentResponse;
        UserResponse userResponse;
        ClassResponse classResponse;
        ModuleResponse moduleResponse;

        try {
            assignmentResponse = contentServiceClient.getAssignment(submissionRequest.getAssignmentId()).getResult();
            log.info("Fetched assignment with ID: {}", submissionRequest.getAssignmentId());
        }catch (FeignException e){
            throw new FeignClientException("Failed to fetch assignment with ID: " + submissionRequest.getAssignmentId());
        }
        try {
            userResponse = authServiceClient.getUser(userId).getResult();
            log.info("Fetched user with ID: {}", userId);
        }catch (FeignClientException e){
            throw new FeignClientException("Failed to fetch user with ID: " + userId);
        }
        try {
            classResponse = classManagementServiceClient.getClassById(submissionRequest.getClassId()).getResult();
            log.info("Fetched class with ID: {}", submissionRequest.getClassId());
        }catch (FeignClientException e){
            throw new FeignClientException("Failed to fetch class with ID: " + submissionRequest.getClassId());
        }
        try {
            moduleResponse = contentServiceClient.getModule(submissionRequest.getModuleId()).getResult();
            log.info("Fetched module with ID: {}", submissionRequest.getModuleId());
        }catch (FeignClientException e){
            throw new FeignClientException("Failed to fetch module with ID: " + submissionRequest.getModuleId());
        }

        Submission submission = submissionMapper.submissionRequestToSubmission(submissionRequest, userResponse, assignmentResponse, classResponse, moduleResponse);
        submissionRepository.save(submission);
        log.info("Submission saved");

        if(!submissionRequest.getExamMode()) {
            String accessToken = GetTokenUtil.getToken();
            SubmissionEvent submissionEvent = SubmissionEvent.builder()
                    .id(submission.getId())
                    .accessToken(accessToken)
                    .contentAssignment(assignmentResponse.getCommonDescription() + moduleResponse.getModuleDescription())
                    .solutionPlantUmlCode(moduleResponse.getSolutionCode())
                    .typeUmlName(submissionRequest.getTypeUmlName())
                    .studentPlantUmlCode(submissionRequest.getStudentPlantUmlCode())
                    .build();

            try {
                String message = objectMapper.writeValueAsString(submissionEvent);
                kafkaTemplate.send("umlDiagram.submission", message);
                log.info("Submission event sent to Kafka for submission ID: {}", submission.getId());
//                actionScheduler.checkSubmissionStatus(submission.getId());
            } catch (JsonProcessingException e) {
                log.error("Error serializing submission event: {}", e.getMessage());
            } catch (KafkaException e) {
                log.error("Error sending submission event to Kafka: {}", e.getMessage());
            }
        }
        return submission.getId();
    }

    @Override
    public Page<SubmissionResponse> getSubmissions(int page, int size, String sortBy, String sortOrder, Long studentId, Long assignmentId, Long classId, LocalDateTime fromDate, LocalDateTime toDate){
        Sort.Direction direction = sortOrder.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sort = switch (sortBy) {
            default -> Sort.by(direction, "createdDate");
        };

        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<Submission> spec = Specification
                .where(SubmissionSpecification.hasStudentId(studentId))
                .and(SubmissionSpecification.hasAssignmentId(assignmentId))
                .and(SubmissionSpecification.hasClassId(classId))
                .and(SubmissionSpecification.hasCreatedDateBetween(fromDate, toDate));

        Page<Submission> result = submissionRepository.findAll(spec, pageable);
        log.info("Get all submissions with criteria");
        Set<Long> studentIds = new HashSet<>();
        Set<Long> assignmentIds = new HashSet<>();
        Set<Long> classIds = new HashSet<>();
        Map<Long, UserResponse> userMap;
        Map<Long, AssignmentResponse> assignmentMap;
        Map<Long, ClassResponse> classMap;
        result.forEach(comment -> {
            studentIds.add(comment.getStudentId());
            assignmentIds.add(comment.getAssignmentId());
            classIds.add(comment.getClassId());
        });

        try{
            userMap = authServiceClient.getExerciseMap(new ArrayList<>(studentIds)).getResult();
        }catch (FeignClientException e){
            throw new FeignClientException("Failed to fetch user map from Auth Service");
        }
        try{
            assignmentMap = contentServiceClient.getExerciseMap(new ArrayList<>(assignmentIds)).getResult();
        }catch (FeignClientException e){
            throw new FeignClientException("Failed to fetch assignment map from Content Service");
        }
        try{
            classMap = classManagementServiceClient.getClassesByIds(new ArrayList<>(classIds)).getResult();
        }catch (FeignClientException e){
            throw new FeignClientException("Failed to fetch class map from Class Management Service");
        }
        return result.map(submission -> {
            UserResponse user = userMap.get(submission.getStudentId());
            AssignmentResponse assignment = assignmentMap.get(submission.getAssignmentId());
            ClassResponse classResponse = classMap.get(submission.getClassId());

            return submissionMapper.toSubmissionResponse(submission, user, assignment, classResponse);
        });
    }


    @Override
    public SubmissionResponse getSubmission(Long id) {
        Optional<Submission> submissionOptional = submissionRepository.findByIdAndStatus(id, 1);
        if (!submissionOptional.isPresent()) {
            throw new NotFoundException("Submission not found with ID: " + id);
        }
        Submission submission = submissionOptional.get();
        AssignmentResponse assignmentResponse;
        UserResponse userResponse;
        ClassResponse classResponse;
        ModuleResponse moduleResponse;
        try {
            assignmentResponse = contentServiceClient.getAssignment(submission.getAssignmentId()).getResult();
            log.info("Fetched assignment with ID: {}", submission.getAssignmentId());
        }catch (FeignException e){
            throw new FeignClientException("Failed to fetch assignment with ID: " + submission.getAssignmentId());
        }
        try {
            userResponse = authServiceClient.getUser(submission.getStudentId()).getResult();
            log.info("Fetched user with ID: {}", submission.getStudentId());
        }catch (FeignClientException e){
            throw new FeignClientException("Failed to fetch user with ID: " + submission.getStudentId());
        }
        try {
            classResponse = classManagementServiceClient.getClassById(submission.getClassId()).getResult();
            log.info("Fetched class with ID: {}", submission.getClassId());
        }catch (FeignClientException e){
            throw new FeignClientException("Failed to fetch class with ID: " + submission.getClassId());
        }
        try {
            moduleResponse = contentServiceClient.getModule(submission.getModuleId()).getResult();
            log.info("Fetched module with ID: {}", submission.getModuleId());
        }catch (FeignClientException e){
            throw new FeignClientException("Failed to fetch module with ID: " + submission.getModuleId());
        }
        SubmissionResponse submissionResponse=submissionMapper.toSubmissionResponse(submission, userResponse, assignmentResponse, classResponse);
        submissionResponse.setModuleName(moduleResponse.getModuleName());
        submissionResponse.setSolutionCode(moduleResponse.getSolutionCode());
        submissionResponse.setTypeUml("use case");
        submissionResponse.setDescriptionModule(moduleResponse.getModuleDescription());
        return submissionResponse;
    }

    @Override
    public String addScoreSubmission(Long id, Double point) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Submission not found "));
        submission.setScore(point);
        submissionRepository.save(submission);
        log.info("Added score to submission with ID: {}", id);
        return "Score added successfully";
    }


    @Override
    public Page<SubmissionResponse> getSubmissionsHistoryExerciseMode(int page, int size, String sortBy, String sortOrder, Long classId, Long assignmentId, Long studentId, Boolean examMode){

        if (classId == null || assignmentId == null || studentId == null) {
            throw new FieldRequiredException("ClassId, AssignmentId and StudentId are required");
        }

        Sort.Direction direction = sortOrder.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sort = Sort.by(direction, "createdDate");
        Pageable pageable = PageRequest.of(page, size, sort);

        UserUtils.UserInfo currentUser = UserUtils.getCurrentUser();
        if(currentUser.roles().contains("ROLE_student") && !Objects.equals(currentUser.userId(), studentId)){
                throw new NotFoundException("You are not authorized to view other student's submission history");
        }
        Specification<Submission> spec = Specification
                .where(SubmissionSpecification.hasClassId(classId))
                .and(SubmissionSpecification.hasAssignmentId(assignmentId))
                .and(SubmissionSpecification.hasStudentId(studentId))
                .and(SubmissionSpecification.hasExamMode(examMode));

        Page<Submission> result = submissionRepository.findAll(spec, pageable);
        log.info("Get all submissions history for student");
        Set<Long> studentIds = new HashSet<>();
        Set<Long> assignmentIds = new HashSet<>();
        Set<Long> classIds = new HashSet<>();
        result.forEach(comment -> {
            studentIds.add(comment.getStudentId());
            assignmentIds.add(comment.getAssignmentId());
            classIds.add(comment.getClassId());
        });
        Map<Long, UserResponse> userMap;
        Map<Long, AssignmentResponse> assignmentMap;
        Map<Long, ClassResponse> classMap;
        result.forEach(comment -> {
            studentIds.add(comment.getStudentId());
            assignmentIds.add(comment.getAssignmentId());
            classIds.add(comment.getClassId());
        });

        try{
            userMap = authServiceClient.getExerciseMap(new ArrayList<>(studentIds)).getResult();
        }catch (FeignClientException e){
            throw new FeignClientException("Failed to fetch user map from Auth Service");
        }
        try{
            assignmentMap = contentServiceClient.getExerciseMap(new ArrayList<>(assignmentIds)).getResult();
        }catch (FeignClientException e){
            throw new FeignClientException("Failed to fetch assignment map from Content Service");
        }
        try{
            classMap = classManagementServiceClient.getClassesByIds(new ArrayList<>(classIds)).getResult();
        }catch (FeignClientException e){
            throw new FeignClientException("Failed to fetch class map from Class Management Service");
        }
        return result.map(submission -> {
            UserResponse user = userMap.get(submission.getStudentId());
            AssignmentResponse assignment = assignmentMap.get(submission.getAssignmentId());
            ClassResponse classResponse = classMap.get(submission.getClassId());
            return submissionMapper.toSubmissionResponse(submission, user, assignment, classResponse);
        });
    }

    @Override
    public SubmissionResponse getLastSubmissionsExamMode(Long classId, Long assignmentId, Long typeUmlId, Long moduleId) {
//        if (classId == null || assignmentId == null) {
//            throw new FieldRequiredException("ClassId and AssignmentId are required");
//        }
//
//        UserUtils.UserInfo currentUser = UserUtils.getCurrentUser();
//        Long userId = currentUser.userId();
//        Optional<Submission> submissionOptional = submissionRepository
//                .findTopByClassIdAndAssignmentIdAndStudentIdAndModuleIdAndTypeUmlIdAndExamModeOrderByCreatedDateDescAndExamModeOrderByCreatedDateDesc(classId, assignmentId, userId, moduleId,typeUmlId, true);
//
//        if (!submissionOptional.isPresent()) {
//            throw new NotFoundException("No exam mode submission found for the given class and assignment");
//        } else {
//            Submission submission = submissionOptional.get();
//            AssignmentResponse assignmentResponse;
//            UserResponse userResponse;
//            ClassResponse classResponse;
//            ModuleResponse moduleResponse;
//            try {
//                assignmentResponse = contentServiceClient.getAssignment(submission.getAssignmentId()).getResult();
//                log.info("Fetched assignment with ID: {}", submission.getAssignmentId());
//            }catch (FeignException e){
//                throw new FeignClientException("Failed to fetch assignment with ID: " + submission.getAssignmentId());
//            }
//            try {
//                userResponse = authServiceClient.getUser(userId).getResult();
//                log.info("Fetched user with ID: {}", userId);
//            }catch (FeignClientException e){
//                throw new FeignClientException("Failed to fetch user with ID: " + userId);
//            }
//            try {
//                classResponse = classManagementServiceClient.getClassById(submission.getClassId()).getResult();
//                log.info("Fetched class with ID: {}", submission.getClassId());
//            }catch (FeignClientException e){
//                throw new FeignClientException("Failed to fetch class with ID: " + submission.getClassId());
//            }
//            try {
//                moduleResponse = contentServiceClient.getModule(submission.getModuleId()).getResult();
//                log.info("Fetched module with ID: {}", submission.getModuleId());
//            }catch (FeignClientException e){
//                throw new FeignClientException("Failed to fetch module with ID: " + submission.getModuleId());
//            }
//            SubmissionResponse submissionResponse=submissionMapper.toSubmissionResponse(submission, userResponse, assignmentResponse, classResponse);
//            submissionResponse.setModuleName(moduleResponse.getModuleName());
//            return submissionResponse;
//        }
        return null;
    }

    @Override
    public Page<SubmissionResponse> getLastSubmissionsExamModes(int page, int size, String sortBy, String sortOrder, Long classId, Long assignmentId) {

        if (classId == null || assignmentId == null) {
            throw new FieldRequiredException("ClassId and AssignmentId are required");
        }

        AssignmentResponse assignmentResponse;
        try {
            assignmentResponse = contentServiceClient.getAssignmentByClassId(classId,assignmentId).getResult();
            log.info("Fetched assignment with ID: {}", assignmentId);
        }catch (FeignException e){
            throw new FeignClientException("Failed to fetch assignment with ID: " + assignmentId);
        }

        //Thiếu Type UML
        List<Long> moduleIds=new ArrayList<>();
        assignmentResponse.getModules().forEach(moduleResponse -> {
            moduleIds.add(moduleResponse.getId());
        });

        Sort.Direction direction = sortOrder.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sort = switch (sortBy) {
            case "studentName" -> Sort.by(direction, "studentName");
            default -> Sort.by(direction, "createdDate");
        };
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<Submission> spec = Specification
                .where(SubmissionSpecification.hasClassId(classId))
                .and(SubmissionSpecification.hasAssignmentId(assignmentId))
                .and(SubmissionSpecification.hasModuleId(moduleIds.get(0))) // fix tạm
                .and(SubmissionSpecification.isLatestSubmissionPerWithExamMode());

        Page<Submission> submissions = submissionRepository.findAll(spec, pageable);
        log.info("Get all submissions for class ID: {} and assignment ID: {}", classId, assignmentId);

        Set<Long> studentIds = new HashSet<>();
        Set<Long> assignmentIds = new HashSet<>();
        Set<Long> classIds = new HashSet<>();
        Map<Long, UserResponse> userMap;
        Map<Long, AssignmentResponse> assignmentMap;
        Map<Long, ClassResponse> classMap;
        submissions.forEach(comment -> {
            studentIds.add(comment.getStudentId());
            assignmentIds.add(comment.getAssignmentId());
            classIds.add(comment.getClassId());
        });

        try{
            userMap = authServiceClient.getExerciseMap(new ArrayList<>(studentIds)).getResult();
        }catch (FeignClientException e){
            throw new FeignClientException("Failed to fetch user map from Auth Service");
        }
        try{
            assignmentMap = contentServiceClient.getExerciseMap(new ArrayList<>(assignmentIds)).getResult();
        }catch (FeignClientException e){
            throw new FeignClientException("Failed to fetch assignment map from Content Service");
        }
        try{
            classMap = classManagementServiceClient.getClassesByIds(new ArrayList<>(classIds)).getResult();
        }catch (FeignClientException e){
            throw new FeignClientException("Failed to fetch class map from Class Management Service");
        }
        return submissions.map(submission -> {
            UserResponse user = userMap.get(submission.getStudentId());
            AssignmentResponse assignment = assignmentMap.get(submission.getAssignmentId());
            ClassResponse classResponse = classMap.get(submission.getClassId());
            return submissionMapper.toSubmissionResponse(submission, user, assignment, classResponse);
        });
    }

}
