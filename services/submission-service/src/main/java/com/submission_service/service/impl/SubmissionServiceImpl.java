package com.submission_service.service.impl;

import com.submission_service.model.dto.request.SubmissionRequest;
import com.submission_service.model.dto.response.SubmissionResponse;
import com.submission_service.service.SubmissionService;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;

@Getter
@Setter
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Service
public class SubmissionServiceImpl implements SubmissionService {
    private final RestTemplate restTemplate;

    private final String PLANTUML_SERVER_URL = "http://localhost:8091/svg";

    @Override
    public SubmissionResponse handleSubmission(SubmissionRequest submissionRequest) {
        // Kiểm tra dữ liệu đầu vào
        if (submissionRequest == null || submissionRequest.getPlantUmlCode() == null || submissionRequest.getPlantUmlCode().isBlank()) {
            return SubmissionResponse.builder()
                    .status("ERROR")
                    .message("PlantUML code cannot be null or empty")
                    .build();
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_PLAIN);
            HttpEntity<String> request = new HttpEntity<>(submissionRequest.getPlantUmlCode(), headers);
            // Sử dụng exchange để xử lý mọi mã trạng thái
            ResponseEntity<String> response = restTemplate.exchange(
                    PLANTUML_SERVER_URL,
                    HttpMethod.POST,
                    request,
                    String.class
            );

            // In body để debug
            System.out.println("PlantUML Server Response (Status: " + response.getStatusCode() + "): " + response.getBody());

            // Xử lý mã trạng thái
            if (response.getStatusCode().is2xxSuccessful()) {
                return SubmissionResponse.builder()
                        .status("OK")
                        .message("PlantUML code is valid")
                        .build();
            } else if (response.getStatusCode().value() == 400) {
                // Lỗi cú pháp, throw ngoại lệ tùy chỉnh
                throw new RuntimeException("Syntax Error in PlantUML code: " + response.getBody());
            } else {
                return SubmissionResponse.builder()
                        .status("ERROR")
                        .message("Unexpected response from PlantUML server: " + response.getStatusCode())
                        .build();
            }

        } catch (RestClientException e) {
            return SubmissionResponse.builder()
                    .status("ERROR")
                    .message("Failed to connect to PlantUML server: " + e.getMessage())
                    .build();
        }
    }
}