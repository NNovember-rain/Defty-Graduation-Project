package com.submission_service.controller;

import com.submission_service.model.dto.request.SubmissionRequest;
import com.submission_service.model.dto.response.SubmissionResponse;
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
    ResponseEntity<?> validatePlantUML(@RequestBody SubmissionRequest submissionRequest) {
        SubmissionResponse message=submissionService.handleSubmission(submissionRequest);
        return new ResponseEntity<>(message, HttpStatus.OK);
    }
}