package com.submission_service.service.impl;


import com.example.common_library.exceptions.FeignClientException;
import com.example.common_library.exceptions.FieldRequiredException;
import com.example.common_library.exceptions.NotFoundException;
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
import com.submission_service.model.entity.SubmissionFeedback;
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
import org.springframework.kafka.annotation.KafkaListener;
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

    @KafkaListener(topics = "umlDiagram.handle", groupId = "uml-consumer-group")
    public void listenSubmissionEvent(String message) {
        try {
            SubmissionEvent event = objectMapper.readValue(message, SubmissionEvent.class);
            log.info("📩 Received SubmissionEvent: {}", event);
        } catch (Exception e) {
            log.error("❌ Error processing Kafka message: {}", e.getMessage(), e);
        }
    }


    @Override
    public Long handleSubmission(SubmissionRequest submissionRequest) {
        if (submissionRequest == null || submissionRequest.getStudentPlantUmlCode() == null || submissionRequest.getStudentPlantUmlCode().isBlank()) {
            throw new FieldRequiredException("Please provide a student plant UML code");
        }
        UserUtils.UserInfo currentUser = UserUtils.getCurrentUser();
        Long userId = currentUser.userId();
        log.info("Get userId from context");

        AssignmentClassDetailResponse assignmentClassDetailResponse;
        try {
            assignmentClassDetailResponse = contentServiceClient.getAssignmentClassDetail(submissionRequest.getAssignmentClassDetailId(), submissionRequest.getTypeUml().name(), submissionRequest.getModuleId()).getResult();
            log.info("Fetched assignment class detail by id with ID: {}", submissionRequest.getAssignmentClassDetailId());
        }catch (FeignException e){
            throw new FeignClientException("Failed to fetch assignment");
        }

        Submission submission = submissionMapper.submissionRequestToSubmission(submissionRequest,userId);
        submission.setAssignmentId(assignmentClassDetailResponse.getAssignmentId());
        submission.setClassId(submissionRequest.getClassId());
        submission.setExamMode(submissionRequest.getExamMode());
        submission.setStudentPlantUMLCode(submissionRequest.getStudentPlantUmlCode());
        submissionRepository.save(submission);
        log.info("Submission saved");



        //TODO: call sang assignment service để lấy thông tin assignment class detail
//        String accessToken = GetTokenUtil.getToken();
//        SubmissionEvent submissionEvent = SubmissionEvent.builder()
//                .id(submission.getId())
//                .accessToken(accessToken)
//                .contentAssignment(assignmentClassDetailResponse.getAssignmentDescription() + assignmentClassDetailResponse.getModuleDescription())
//                .solutionPlantUmlCode(assignmentClassDetailResponse.getSolutionCode())
//                .typeUmlName(submissionRequest.getTypeUml())
//                .studentPlantUmlCode(submissionRequest.getStudentPlantUmlCode())
//                .build();

        try {
//            String message = objectMapper.writeValueAsString(submissionEvent);
//            kafkaTemplate.send("umlDiagram.submission", message);
//            log.info("Submission event sent to Kafka for submission ID: {}", submission.getId());
//                actionScheduler.checkSubmissionStatus(submission.getId());
//        } catch (JsonProcessingException e) {
//            log.error("Error serializing submission event: {}", e.getMessage());
        } catch (KafkaException e) {
            log.error("Error sending submission event to Kafka: {}", e.getMessage());
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
        result.forEach(submission -> {
            studentIds.add(submission.getStudentId());
            assignmentIds.add(submission.getAssignmentId());
            classIds.add(submission.getClassId());
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
            UserResponse user = null;
            AssignmentResponse assignment = null;
            ClassResponse classResponse = null;
            if (userMap != null)
                user = userMap.get(submission.getStudentId());

            if (assignmentMap != null)
                assignment = assignmentMap.get(submission.getAssignmentId());

            if (classMap != null)
                classResponse = classMap.get(submission.getClassId());

            return submissionMapper.toSubmissionResponse(submission, user, assignment, classResponse);
        });
    }


    @Override
    public SubmissionDetailResponse getSubmission(Long id) {
//        Optional<Submission> submissionOptional = submissionRepository.findByIdAndStatus(id, 1);
//        if (!submissionOptional.isPresent()) {
//            throw new NotFoundException("Submission not found with ID: " + id);
//        }
//        Submission submission = submissionOptional.get();
//        AssignmentResponse assignmentResponse;
//        UserResponse userResponse;
//        ClassResponse classResponse;
//        try {
//            assignmentResponse = contentServiceClient.getAssignment(submission.getAssignmentId()).getResult();
//            log.info("Fetched assignment with ID: {}", submission.getAssignmentId());
//        }catch (FeignException e){
//            throw new FeignClientException("Failed to fetch assignment with ID: " + submission.getAssignmentId());
//        }
//        try {
//            userResponse = authServiceClient.getUser(submission.getStudentId()).getResult();
//            log.info("Fetched user with ID: {}", submission.getStudentId());
//        }catch (FeignClientException e){
//            throw new FeignClientException("Failed to fetch user with ID: " + submission.getStudentId());
//        }
//        try {
//            classResponse = classManagementServiceClient.getClassById(submission.getClassId()).getResult();
//            log.info("Fetched class with ID: {}", submission.getClassId());
//        }catch (FeignClientException e){
//            throw new FeignClientException("Failed to fetch class with ID: " + submission.getClassId());
//        }

        //TODO: call sang assignment service để lấy thông tin assignment class detail
//        SubmissionDetailResponse submissionResponse=submissionMapper.toSubmissionDetailResponse(submission, userResponse, assignmentResponse, classResponse);
//        submissionResponse.setModuleName(moduleResponse.getModuleName());
//        submissionResponse.setSolutionCode(moduleResponse.getSolutionCode());
//        submissionResponse.setTypeUml("use case");
//        submissionResponse.setDescriptionModule(moduleResponse.getModuleDescription());
//        return submissionResponse;
        return null;
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
    public LastSubmissionResonse getLastSubmissionsExamMode(Long classId, Long assignmentClassDetailId) {
        if (classId == null || assignmentClassDetailId == null) {
            throw new FieldRequiredException("ClassId and AssignmentId are required");
        }

        UserUtils.UserInfo currentUser = UserUtils.getCurrentUser();
        Long userId = currentUser.userId();
        Optional<Submission> submissionOptional = submissionRepository
                .findTopByClassIdAndAssignmentClassDetailIdAndStudentIdAndExamModeOrderByCreatedDateDesc(classId, assignmentClassDetailId, userId, true);

        if (!submissionOptional.isPresent()) {
            throw new NotFoundException("No exam mode submission found for the given class and assignment");
        } else {
            Submission submission = submissionOptional.get();
            List<SubmissionFeedbackResponse> feedbacks = new ArrayList<>();
            if(!submission.getSubmissionFeedbacks().isEmpty()) {
                UserResponse userResponse = submission.getSubmissionFeedbacks().get(0) != null ?
                        authServiceClient.getUser(submission.getSubmissionFeedbacks().get(0).getUserId()).getResult() : null;

                submission.getSubmissionFeedbacks().forEach(feedbackTeacher -> {
                    SubmissionFeedbackResponse submissionFeedbackResponse = SubmissionFeedbackResponse.builder()
                            .teacherId(feedbackTeacher.getUserId())
                            .content(feedbackTeacher.getContent())
                            .fullName(userResponse.getFullName())
                            .createdDate(feedbackTeacher.getCreatedDate())
                            .build();
                    feedbacks.add(submissionFeedbackResponse);
                });
            }
            return LastSubmissionResonse.builder()
                    .id(submission.getId())
                    .score(submission.getScore())
                    .studentPlantUMLCode(submission.getStudentPlantUMLCode())
                    .createdDate(submission.getCreatedDate())
                    .submissionFeedbackResponse(feedbacks)
                    .build();
        }
    }

    @Override
    public Page<SubmissionResponse> getLastSubmissionsExamModes(int page, int size, String sortBy, String sortOrder, Long classId, Long assignmentClassDetailId) {

        if (classId == null || assignmentClassDetailId == null) {
            throw new FieldRequiredException("ClassId and AssignmentId are required");
        }


        Sort.Direction direction = sortOrder.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sort = switch (sortBy) {
            case "studentName" -> Sort.by(direction, "studentName");
            default -> Sort.by(direction, "createdDate");
        };
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<Submission> spec = Specification
                .where(SubmissionSpecification.hasClassId(classId))
                .and(SubmissionSpecification.hasAssignmentClassDetailId(assignmentClassDetailId))
                .and(SubmissionSpecification.isLatestSubmissionPerWithExamMode());

        Page<Submission> submissions = submissionRepository.findAll(spec, pageable);
        log.info("Get all submissions for class ID: {} and assignmentClassDetail ID: {}", classId, assignmentClassDetailId);

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

    @Override
    public Page<SubmissionResponse> getSubmissionsHistoryExerciseMode(int page, int size, String sortBy, String sortOrder, Long classId, Long assignmentId, Long studentId, Long moduleId, Boolean examMode){

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
                .and(SubmissionSpecification.hasModuleId(moduleId))
                .and(SubmissionSpecification.hasExamMode(examMode));

        Page<Submission> result = submissionRepository.findAll(spec, pageable);
        log.info("Get all submissions history for student");
        Set<Long> studentIds = new HashSet<>();
        Set<Long> assignmentIds = new HashSet<>();
        Set<Long> classIds = new HashSet<>();
        Set<Long> moduleIds = new HashSet<>();
        result.forEach(submission -> {
            studentIds.add(submission.getStudentId());
            assignmentIds.add(submission.getAssignmentId());
            classIds.add(submission.getClassId());
//            moduleIds.add(submission.get)
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
            UserResponse user = null;
            AssignmentResponse assignment = null;
            ClassResponse classResponse = null;
            if (userMap != null)
                user = userMap.get(submission.getStudentId());

            if (assignmentMap != null)
                assignment = assignmentMap.get(submission.getAssignmentId());

            if (classMap != null)
                classResponse = classMap.get(submission.getClassId());
            return submissionMapper.toSubmissionResponse(submission, user, assignment, classResponse);
        });
    }

    @Override
    public SubmissionDetailResponse getSubmissionStudentFeedback(Long id) {
        Optional<Submission> submissionOptional = submissionRepository.findByIdAndStatus(id, 1);
        if (!submissionOptional.isPresent()) {
            throw new NotFoundException("Submission not found with ID: " + id);
        }
        Submission submission = submissionOptional.get();
        UserResponse userResponse;
        ClassResponse classResponse;
        ModuleSolutionDetailResponse moduleSolutionDetailResponse;
        try {
            userResponse = authServiceClient.getUser(submission.getStudentId()).getResult();
            log.info("Fetched user with ID: {}", submission.getStudentId());
        } catch (FeignClientException e) {
            throw new FeignClientException("Failed to fetch user with ID: " + submission.getStudentId());
        }
        try {
            classResponse = classManagementServiceClient.getClassById(submission.getClassId()).getResult();
            log.info("Fetched class with ID: {}", submission.getClassId());
        } catch (FeignClientException e) {
            throw new FeignClientException("Failed to fetch class with ID: " + submission.getClassId());
        }

        try {
            moduleSolutionDetailResponse = contentServiceClient.getModuleSolution(submission.getModuleId(), submission.getTypeUml().name(), submission.getAssignmentId()).getResult();
            log.info("Fetched class with ID: {}", submission.getClassId());
        } catch (FeignClientException e) {
            throw new FeignClientException("Failed to fetch class with ID: " + submission.getClassId());
        }

        List<SubmissionFeedback> feedbacks = submission.getSubmissionFeedbacks();
        List<SubmissionFeedbackResponse> feedbackResponses = new ArrayList<>();
        feedbacks.forEach(feedbackTeacher -> {
            SubmissionFeedbackResponse submissionFeedbackResponse = SubmissionFeedbackResponse.builder()
                    .teacherId(feedbackTeacher.getUserId())
                    .content(feedbackTeacher.getContent())
                    .fullName(userResponse.getFullName())
                    .createdDate(feedbackTeacher.getCreatedDate())
                    .build();
            feedbackResponses.add(submissionFeedbackResponse);
        });

        SubmissionDetailResponse submissionResponse = submissionMapper.toSubmissionDetailResponse(submission, userResponse, classResponse);
        submissionResponse.setModuleName(moduleSolutionDetailResponse.getModuleName());
        submissionResponse.setSolutionCode(moduleSolutionDetailResponse.getSolutionCode());
        submissionResponse.setTypeUml(submission.getTypeUml().name());
        submissionResponse.setDescriptionModule(moduleSolutionDetailResponse.getModuleDescription());
        submissionResponse.setDescriptionAssignment(moduleSolutionDetailResponse.getCommonDescriptionHtml());
        submissionResponse.setAssignmentTitle(moduleSolutionDetailResponse.getAssignmentName());

        submissionResponse.setSubmissionFeedbackResponse(feedbackResponses);
        return submissionResponse;
    }
}
