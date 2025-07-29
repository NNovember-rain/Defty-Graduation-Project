package com.submission_service.controller;

import com.submission_service.enums.SubmissionStatus;
import com.submission_service.model.buider.SubmissionSearchBuilder;
import com.submission_service.model.dto.request.SubmissionRequest;
import com.submission_service.model.dto.response.ApiResponse;
import com.submission_service.model.dto.response.SubmissionDetailResponse;
import com.submission_service.model.dto.response.SubmissionResponse;
import com.submission_service.service.SubmissionService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import javax.swing.text.Document;
import java.time.LocalDate;

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

    @GetMapping({"/{id}"})
    ApiResponse<?> getSubmissions(@PathVariable Long id) {
        SubmissionDetailResponse submissionResponses =submissionService.getSubmission(id);
        return ApiResponse.builder()
                .result(submissionResponses)
                .build();
    }

    @GetMapping()
    ApiResponse<?> getSubmissions(@RequestParam(required = false) String studentName,
                                            @RequestParam(required = false) String assignmentTitle,
                                            @RequestParam(required = false) SubmissionStatus submissionStatus,
                                            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
                                            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
                                            @RequestParam(required = false) String className,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "10") int size) {

        SubmissionSearchBuilder criteria = SubmissionSearchBuilder.builder()
                .studentName(studentName)
                .assignmentTitle(assignmentTitle)
                .className(className)
                .submissionStatus(submissionStatus)
                .fromDate(fromDate)
                .toDate(toDate)
                .build();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdDate").descending());
        Page<SubmissionResponse>submissionResponses =submissionService.getAllSubmissions(pageable,criteria);
        return ApiResponse.<Page<SubmissionResponse>>builder()
                .result(submissionResponses)
                .build();
    }
}