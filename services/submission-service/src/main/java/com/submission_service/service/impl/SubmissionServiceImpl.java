package com.submission_service.service.impl;


import com.example.common_library.exceptions.FeignClientException;
import com.example.common_library.exceptions.NotFoundException;
import com.example.common_library.response.ApiResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.submission_service.client.ContentServiceClient;
import com.submission_service.client.AuthServiceClient;
import com.submission_service.client.ClassManagementServiceClient;
import com.submission_service.model.buider.SubmissionSearchBuilder;
import com.submission_service.model.dto.request.SubmissionRequest;
import com.submission_service.model.dto.response.*;
import com.submission_service.model.entity.Submission;
import com.submission_service.model.event.AssignmentEvent;
import com.submission_service.model.event.SubmissionEvent;
import com.submission_service.repository.ISubmissionRepository;
import com.submission_service.repository.specification.SubmissionSpecification;
import com.submission_service.service.SubmissionService;
import feign.FeignException;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.apache.kafka.common.errors.ResourceNotFoundException;
import org.modelmapper.ModelMapper;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.*;
import org.springframework.kafka.KafkaException;
import org.springframework.messaging.MessagingException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.kafka.core.KafkaTemplate;

import java.util.Optional;

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


    @NonFinal
    @Value("${PLANTUML_SERVER_URL}")
    String PLANTUML_SERVER_URL;

    KafkaTemplate<String, Object> kafkaTemplate;

    @Override
    public Long handleSubmission(SubmissionRequest submissionRequest) {
        // Kiểm tra dữ liệu đầu vào
        if (submissionRequest == null || submissionRequest.getStudentPlantUmlCode() == null || submissionRequest.getStudentPlantUmlCode().isBlank()) {
            throw new RestClientException("Please provide a student plant UML code");
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_PLAIN);
            HttpEntity<String> request = new HttpEntity<>(submissionRequest.getStudentPlantUmlCode(), headers);
            // Sử dụng exchange để xử lý mọi mã trạng thái
            ResponseEntity<String> response = restTemplate.exchange(
                    PLANTUML_SERVER_URL,
                    HttpMethod.POST,
                    request,
                    String.class
            );

            ApiResponse<AssignmentResponse> assignmentResponse = contentServiceClient.getAssignment(submissionRequest.getAssignmentId());
            ApiResponse<UserResponse> userResponse = authServiceClient.getUser(submissionRequest.getStudentId());
            ApiResponse<ClassResponse> classResponse = classManagementServiceClient.getClassById(submissionRequest.getClassId());
            Submission submission = Submission.builder()
                    .studentId(submissionRequest.getStudentId())
                    .studentCode(userResponse.getResult().getUserCode())
                    .studentName(userResponse.getResult().getFullName())
                    .assignmentId(submissionRequest.getAssignmentId())
                    .assignmentTitle(assignmentResponse.getResult().getTitle())
                    .umlType(assignmentResponse.getResult().getTypeUmlName())
                    .classId(classResponse.getResult().getId())
                    .classCode(classResponse.getResult().getInviteCode())
                    .studentPlantUMLCode(submissionRequest.getStudentPlantUmlCode())
                    .build();
            submissionRepository.save(submission);

            SubmissionEvent submissionEvent= SubmissionEvent.builder()
                    .id(submission.getId())
                    .contentAssignment(assignmentResponse.getResult().getDescription())
                    .solutionPlantUmlCode(assignmentResponse.getResult().getSolutionCode())
                    .typeUmlName(assignmentResponse.getResult().getTypeUmlName())
                    .studentPlantUmlCode(submissionRequest.getStudentPlantUmlCode())
                    .build();

            String message = objectMapper.writeValueAsString(submissionEvent);
            kafkaTemplate.send("submission.sendSubmission", message);
            return submission.getId();

        } catch (HttpClientErrorException.BadRequest e) {
            throw new RestClientException("Syntax Error in PlantUML code");
        } catch (FeignException e) {
            throw new FeignClientException("Fail to fecth data");
        } catch (KafkaException e) {
            throw new MessagingException("Failed to send submission event");
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to convert SubmissionRequest to JSON");
        }
    }

    @Override
    public Page<SubmissionResponse> getAllSubmissions(Pageable pageable, SubmissionSearchBuilder criteria) {

        Specification<Submission> spec = SubmissionSpecification.withCriteria(criteria);
        Page<Submission> pageResult = submissionRepository.findAll(spec, pageable);
        return pageResult.map(submission ->{
            SubmissionResponse submissionResponse=new SubmissionResponse();
            BeanUtils.copyProperties(submission, submissionResponse);
            return submissionResponse;
        });
    }

    @Override
    public SubmissionDetailResponse getSubmission(Long id) {
        Optional<Submission> submissionOptional = submissionRepository.findByIdAndStatus(id, 1);
        if (!submissionOptional.isPresent()) {
            throw new NotFoundException("Submission not found with ID: " + id);
        }

        Submission submission = submissionOptional.get();
        SubmissionDetailResponse submissionResponse = new SubmissionDetailResponse();

        try {
            ApiResponse<AssignmentResponse> assignmentResponse = contentServiceClient.getAssignment(submission.getAssignmentId());
            BeanUtils.copyProperties(submission, submissionResponse);
            submissionResponse.setSolutionCode(assignmentResponse.getResult().getSolutionCode());
            return submissionResponse;
        }catch (FeignException e){
            throw new FeignClientException("Fail to fecth data");
        }

    }
}