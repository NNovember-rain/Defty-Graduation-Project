package com.submission_service.controller;

import com.example.common_library.response.ApiResponse;
import com.submission_service.enums.SubmissionStatus;
import com.submission_service.model.dto.request.SubmissionRequest;
import com.submission_service.model.dto.response.AssignmentClassDetailResponse;
import com.submission_service.model.dto.response.LastSubmissionResonse;
import com.submission_service.model.dto.response.SubmissionDetailResponse;
import com.submission_service.model.dto.response.SubmissionResponse;
import com.submission_service.service.SubmissionService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
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
    ApiResponse<String> addScore(@PathVariable Long id, @RequestParam(required = true) Double point) { //ok
        String response=submissionService.addScoreSubmission(id,point);
        return ApiResponse.<String>builder()
                .result(response)
                .build();
    }

    @GetMapping({"/{id}"})
    ApiResponse<SubmissionDetailResponse> getSubmission(@PathVariable Long id) { //ok
        SubmissionDetailResponse submissionResponses =submissionService.getSubmission(id);
        return ApiResponse.<SubmissionDetailResponse>builder()
                .result(submissionResponses)
                .build();
    }

    @GetMapping
    public ApiResponse<Page<SubmissionResponse>> getSubmissions( //ok
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) Long assignmentId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDateTime toDate,
            @RequestParam(value = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(value = "size", defaultValue = "10") @Min(1) @Max(1000) int size,
            @RequestParam(value = "sortBy", defaultValue = "createdDate") String sortBy,
            @RequestParam(value = "sortOrder", defaultValue = "desc") String sortOrder
    ) {
        Page<SubmissionResponse> submissions = submissionService.getSubmissions(
                page, size, sortBy, sortOrder,
                studentId, assignmentId, classId,
                fromDate, toDate
        );
        return ApiResponse.<Page<SubmissionResponse>>builder()
                .result(submissions)
                .build();
    }

    @GetMapping("/class/{classId}/assignment/{assignmentClassDetailId}/last") //ok
    public ApiResponse<LastSubmissionResonse> getLastSubmissionExamMode(
            @PathVariable Long classId,
            @PathVariable Long assignmentClassDetailId
    ){
        LastSubmissionResonse submissionResponse =submissionService.getLastSubmissionsExamMode(classId,assignmentClassDetailId);
        return ApiResponse.<LastSubmissionResonse>builder()
                .result(submissionResponse)
                .build();
    }

    @GetMapping("/class/{classId}/assignmentClassDetail/{assignmentClassDetailId}")
    public ApiResponse<Page<SubmissionResponse>> getLastSubmissionsExamMode(
            @PathVariable Long classId,
            @PathVariable Long assignmentClassDetailId,
            @RequestParam(value = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(value = "size", defaultValue = "10") @Min(1) @Max(100) int size,
            @RequestParam(value = "sortBy", defaultValue = "createdDate") String sortBy,
            @RequestParam(value = "sortOrder", defaultValue = "desc") String sortOrder) {
        Page<SubmissionResponse>submissionResponses =submissionService.getLastSubmissionsExamModes(page, size, sortBy, sortOrder, classId, assignmentClassDetailId);
        return ApiResponse.<Page<SubmissionResponse>>builder()
                .result(submissionResponses)
                .build();
    }

    @GetMapping("/class/{classId}/assignment/{assignmentId}/student/{studentId}")
    public ApiResponse<Page<SubmissionResponse>> getSubmissionsExerciseMode(@PathVariable Long classId,
                                                                          @PathVariable Long assignmentId,
                                                                          @PathVariable Long studentId,
                                                                          @RequestParam(required = false) Long moduleId,
                                                                          @RequestParam(value = "examMode") Boolean examMode,
                                                                          @RequestParam(value = "page", defaultValue = "0") @Min(0) int page,
                                                                          @RequestParam(value = "size", defaultValue = "10") @Min(1) @Max(1000) int size,
                                                                          @RequestParam(value = "sortBy", defaultValue = "createdDate") String sortBy,
                                                                          @RequestParam(value = "sortOrder", defaultValue = "desc") String sortOrder){

        Page<SubmissionResponse>submissionResponses =submissionService.getSubmissionsHistoryExerciseMode(page, size, sortBy, sortOrder, classId,assignmentId, studentId, moduleId, examMode);
        return ApiResponse.<Page<SubmissionResponse>>builder()
                .result(submissionResponses)
                .build();
    }

}