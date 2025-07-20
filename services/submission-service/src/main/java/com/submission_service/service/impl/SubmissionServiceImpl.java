package com.submission_service.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.util.BeanUtil;
import com.submission_service.model.dto.request.SubmissionRequest;
import com.submission_service.model.dto.response.SubmissionResponse;
import com.submission_service.model.entity.Submission;
import com.submission_service.repository.ISubmissionRepository;
import com.submission_service.service.SubmissionService;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.kafka.core.KafkaTemplate;

@Getter
@Setter
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Service
public class SubmissionServiceImpl implements SubmissionService {
    RestTemplate restTemplate;
    ISubmissionRepository submissionRepository;
    ObjectMapper objectMapper;

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

            // In body để debug
//            System.out.println("PlantUML Server Response (Status: " + response.getStatusCode() + "): " + response.getBody());
//            if (response.getStatusCode().is2xxSuccessful()) {
//            }
            String message = objectMapper.writeValueAsString(submissionRequest);
            kafkaTemplate.send("submission.sendSubmission", message);
            Submission submission=new Submission();
            BeanUtils.copyProperties(submissionRequest, submission);
            return submissionRepository.save(submission).getId();

        }catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to convert SubmissionRequest to Json");
        } catch (RestClientException e) {
            throw new RestClientException("Syntax Error in PlantUML code");
        }
    }
}