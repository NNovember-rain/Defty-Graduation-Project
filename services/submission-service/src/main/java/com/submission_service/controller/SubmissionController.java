package com.submission_service.controller;

import com.submission_service.model.dto.request.SubmissionRequest;
import com.submission_service.model.dto.response.ApiResponse;
import com.submission_service.service.SubmissionService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import javax.swing.text.Document;

@RestController
@RequestMapping("/submission")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SubmissionController {

    SubmissionService submissionService;

    @PostMapping()
    ApiResponse<Long> addSubmissionPlantUML(@RequestBody SubmissionRequest submissionRequest) {
        Long response=submissionService.handleSubmission(submissionRequest);
        return ApiResponse.<Long>builder()
                .result(response)
                .build();
    }


}