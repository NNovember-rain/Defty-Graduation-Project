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
import com.submission_service.model.buider.SubmissionSearchBuilder;
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
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.kafka.KafkaException;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

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

        ApiResponse<AssignmentResponse> assignmentResponse;
        ApiResponse<UserResponse> userResponse;
        ApiResponse<ClassResponse> classResponse;

        try {
            assignmentResponse = contentServiceClient.getAssignment(submissionRequest.getAssignmentId());
            log.info("Fetched assignment with ID: {}", submissionRequest.getAssignmentId());
        }catch (FeignException e){
            throw new FeignClientException("Failed to fetch assignment with ID: " + submissionRequest.getAssignmentId());
        }
        try {
            userResponse = authServiceClient.getUser(userId);
            log.info("Fetched user with ID: {}", userId);
        }catch (FeignClientException e){
            throw new FeignClientException("Failed to fetch user with ID: " + userId);
        }
        try {
            classResponse = classManagementServiceClient.getClassById(submissionRequest.getClassId());
            log.info("Fetched class with ID: {}", submissionRequest.getClassId());
        }catch (FeignClientException e){
            throw new FeignClientException("Failed to fetch class with ID: " + submissionRequest.getClassId());
        }

        Submission submission = submissionMapper.submissionRequestToSubmission(submissionRequest, userResponse.getResult(), assignmentResponse.getResult(), classResponse.getResult());
        submissionRepository.save(submission);
        log.info("Submission saved");

        String accessToken = GetTokenUtil.getToken();
        SubmissionEvent submissionEvent= SubmissionEvent.builder()
                .id(submission.getId())
                .accessToken(accessToken)
                .contentAssignment(assignmentResponse.getResult().getDescription())
                .solutionPlantUmlCode(assignmentResponse.getResult().getSolutionCode())
                .typeUmlName(assignmentResponse.getResult().getTypeUmlName())
                .studentPlantUmlCode(submissionRequest.getStudentPlantUmlCode())
                .build();

        try {
            String message = objectMapper.writeValueAsString(submissionEvent);
            kafkaTemplate.send("umlDiagram.submission", message);
            log.info("Submission event sent to Kafka for submission ID: {}", submission.getId());
            actionScheduler.checkSubmissionStatus(submission.getId());
        }catch (JsonProcessingException e){
            log.error("Error serializing submission event: {}", e.getMessage());
        }catch (KafkaException e) {
            log.error("Error sending submission event to Kafka: {}", e.getMessage());
        }
        return submission.getId();

    }

    @Override
    public Page<SubmissionResponse> getAllSubmissions(Pageable pageable, SubmissionSearchBuilder criteria) {

        Specification<Submission> spec = SubmissionSpecification.withCriteria(criteria);
        Page<Submission> pageResult = submissionRepository.findAll(spec, pageable);
        log.info("get all submissions");
        return pageResult.map(submissionMapper::toSubmissionResponse);
    }

    @Override
    public SubmissionResponse getSubmission(Long id) {
        Optional<Submission> submissionOptional = submissionRepository.findByIdAndStatus(id, 1);
        if (!submissionOptional.isPresent()) {
            throw new NotFoundException("Submission not found with ID: " + id);
        }
        ApiResponse<AssignmentResponse> assignmentResponse = null;
        Submission submission = submissionOptional.get();
        try {
            assignmentResponse = contentServiceClient.getAssignment(1L);
            log.info("Fetched assignment data for submission id: {}", id);
        }catch (FeignException e){
            log.info("Fail to fecth assignment data for submission id: {}", id);
        }
        SubmissionResponse submissionResponse=submissionMapper.toSubmissionResponse(submission);
        if(assignmentResponse!=null){
            submissionResponse.setSolutionCode(assignmentResponse.getResult().getSolutionCode());
            submissionResponse.setTypeUml(assignmentResponse.getResult().getTypeUmlName());
        }
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
    public Page<SubmissionResponse> getAllSubmissionsForStudent(Pageable pageable, Long assignmentId) {
        UserUtils.UserInfo currentUser = UserUtils.getCurrentUser();
        log.info("Get userId from context for student submissions");
        Long userId = currentUser.userId();
        Page<Submission> submissions = submissionRepository.findByStudentIdAndAssignmentId(userId, assignmentId, pageable);
        log.info("get all submissions");
        return submissions.map(submissionMapper::toSubmissionResponse);
    }
}
