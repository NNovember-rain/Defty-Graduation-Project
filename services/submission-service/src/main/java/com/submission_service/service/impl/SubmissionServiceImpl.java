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
import com.submission_service.model.dto.response.AssignmentResponse;
import com.submission_service.model.dto.response.ClassResponse;
import com.submission_service.model.dto.response.SubmissionResponse;
import com.submission_service.model.dto.response.UserResponse;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;
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
                .typeUmlName("class")
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
    public Page<SubmissionResponse> getSubmissions(int page, int size, String sortBy, String sortOrder, String studentName, String studentCode, String assignmentTitle, String className, String classCode, LocalDateTime fromDate, LocalDateTime toDate){
        Sort.Direction direction = sortOrder.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sort = switch (sortBy) {
            default -> Sort.by(direction, "createdDate");
        };

        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<Submission> spec = Specification
                .where(SubmissionSpecification.hasStudentName(studentName))
                .and(SubmissionSpecification.hasStudentCode(studentCode))
                .and(SubmissionSpecification.hasAssignmentTitle(assignmentTitle))
                .and(SubmissionSpecification.hasClassName(className))
                .and(SubmissionSpecification.hasClassCode(classCode))
                .and(SubmissionSpecification.hasCreatedDateBetween(fromDate, toDate));

        Page<Submission> result = submissionRepository.findAll(spec, pageable);
        log.info("Get all submissions with criteria");
        return result.map(submissionMapper::toSubmissionResponse);
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
    public Page<SubmissionResponse> getAllSubmissionsForStudent(int page, int size, String sortBy, String sortOrder, Long classId, Long assignmentId, Long studentId){

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
                .and(SubmissionSpecification.hasStudentId(studentId));

        Page<Submission> submissions = submissionRepository.findAll(spec, pageable);
        log.info("Get all submissions history for student ID: {} in class ID: {} and assignment ID: {}",
                studentId, classId, assignmentId);

        return submissions.map(submissionMapper::toSubmissionResponse);
    }

    @Override
    public Page<SubmissionResponse> getSubmissionsForClass(int page, int size, String sortBy, String sortOrder, Long classId, Long assignmentId) {

        if (classId == null || assignmentId == null) {
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
                .and(SubmissionSpecification.hasAssignmentId(assignmentId))
                .and(SubmissionSpecification.isLatestSubmissionPerStudent());

        Page<Submission> submissions = submissionRepository.findAll(spec, pageable);
        log.info("Get all submissions for class ID: {} and assignment ID: {}", classId, assignmentId);

        return submissions.map(submissionMapper::toSubmissionResponse);
    }


}
