package com.submission_service.controller;

import com.example.common_library.response.ApiResponse;
import com.submission_service.enums.SubmissionStatus;
import com.submission_service.model.dto.request.SubmissionRequest;
import com.submission_service.model.dto.response.SubmissionResponse;
import com.submission_service.service.SubmissionService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;


@RestController
@RequestMapping("/submission")
@RequiredArgsConstructor
@Validated
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
    ApiResponse<SubmissionResponse> getSubmission(@PathVariable Long id) {
        SubmissionResponse submissionResponses =submissionService.getSubmission(id);
        return ApiResponse.<SubmissionResponse>builder()
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
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDateTime toDate,
            @RequestParam(value = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(value = "size", defaultValue = "10") @Min(1) @Max(1000) int size,
            @RequestParam(value = "sortBy", defaultValue = "createdDate") String sortBy,
            @RequestParam(value = "sortOrder", defaultValue = "desc") String sortOrder
    ) {
        Page<SubmissionResponse> submissions = submissionService.getSubmissions(
                page, size, sortBy, sortOrder,
                studentName, studentCode, assignmentTitle,
                className, classCode,
                fromDate, toDate
        );
        return ApiResponse.<Page<SubmissionResponse>>builder()
                .result(submissions)
                .build();
    }

    @GetMapping("/class/{classId}/assignment/{assignmentId}")
    public ApiResponse<Page<SubmissionResponse>> getSubmissions(
            @PathVariable Long classId,
            @PathVariable Long assignmentId,
            @RequestParam(value = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(value = "size", defaultValue = "10") @Min(1) @Max(100) int size,
            @RequestParam(value = "sortBy", defaultValue = "createdDate") String sortBy,
            @RequestParam(value = "sortOrder", defaultValue = "desc") String sortOrder) {
        Page<SubmissionResponse>submissionResponses =submissionService.getSubmissionsForClass(page, size, sortBy, sortOrder, classId,assignmentId);
        return ApiResponse.<Page<SubmissionResponse>>builder()
                .result(submissionResponses)
                .build();
    }

    @GetMapping("/class/{classId}/assignment/{assignmentId}/student/{studentId}")
    public ApiResponse<Page<SubmissionResponse>> getSubmissionsForStudent(@PathVariable Long classId,
                                                                          @PathVariable Long assignmentId,
                                                                          @PathVariable Long studentId,
                                                                          @RequestParam(value = "page", defaultValue = "0") @Min(0) int page,
                                                                          @RequestParam(value = "size", defaultValue = "10") @Min(1) @Max(1000) int size,
                                                                          @RequestParam(value = "sortBy", defaultValue = "createdDate") String sortBy,
                                                                          @RequestParam(value = "sortOrder", defaultValue = "desc") String sortOrder){

        Page<SubmissionResponse>submissionResponses =submissionService.getAllSubmissionsForStudent(page, size, sortBy, sortOrder, classId,assignmentId, studentId);
        return ApiResponse.<Page<SubmissionResponse>>builder()
                .result(submissionResponses)
                .build();
    }
}