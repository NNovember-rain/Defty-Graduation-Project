package com.submission_service.controller;

import com.example.common_library.response.ApiResponse;
import com.submission_service.enums.SubmissionStatus;
import com.submission_service.model.buider.SubmissionSearchBuilder;
import com.submission_service.model.dto.request.SubmissionRequest;
import com.submission_service.model.dto.response.SubmissionDetailResponse;
import com.submission_service.model.dto.response.SubmissionHistoryResponse;
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
import org.springframework.web.bind.annotation.*;

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

    @PutMapping("/score/{id}")
    ApiResponse<String> addScore(@PathVariable Long id, @RequestParam(required = true) Double point) {
        String response=submissionService.addScoreSubmission(id,point);
        return ApiResponse.<String>builder()
                .result(response)
                .build();
    }

    @GetMapping({"/{id}"})
    ApiResponse<SubmissionDetailResponse> getSubmission(@PathVariable Long id) {
        SubmissionDetailResponse submissionResponses =submissionService.getSubmission(id);
        return ApiResponse.<SubmissionDetailResponse>builder()
                .result(submissionResponses)
                .build();
    }

    @GetMapping
    public ApiResponse<Page<SubmissionResponse>> getSubmissions(
            @RequestParam(required = false) String studentName,
            @RequestParam(required = false) String studentCode,
            @RequestParam(required = false) String assignmentTitle,
            @RequestParam(required = false) String className,
            @RequestParam(required = false) String classCode,
            @RequestParam(required = false) String umlType,
            @RequestParam(required = false) SubmissionStatus submissionStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {

        SubmissionSearchBuilder criteria = SubmissionSearchBuilder.builder()
                .studentName(studentName)
                .studentCode(studentCode)
                .assignmentTitle(assignmentTitle)
                .className(className)
                .classCode(classCode)
                .umlType(umlType)
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

    @GetMapping("/student/{studentId}")
    public ApiResponse<Page<SubmissionHistoryResponse>> getSubmissionsForStudent( @PathVariable Long studentId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdDate").descending());
        Page<SubmissionHistoryResponse>submissionResponses =submissionService.getAllSubmissionsForStudent(pageable,studentId);
        return ApiResponse.<Page<SubmissionHistoryResponse>>builder()
                .result(submissionResponses)
                .build();
    }
}