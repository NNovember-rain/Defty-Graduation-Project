package com.submission_service.controller;

import com.example.common_library.response.ApiResponse;
import com.submission_service.model.dto.response.AutoFeedbackLLMEntryResponse;
import com.submission_service.service.AutoFeedbackLLMEntryService;
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
@RequestMapping("/submission/excel-job-entry")
@RequiredArgsConstructor
@Validated
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AutoFeedbackLLMEntryController {
    AutoFeedbackLLMEntryService autoFeedbackLLMJobService;

    @GetMapping("/{jobId}")
    ApiResponse<Page<AutoFeedbackLLMEntryResponse>> getAutoFeedbackLLMJobs(@PathVariable Long jobId,
                                                                         @RequestParam(required = false) String studentInfo,
                                                                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDateTime fromDate,
                                                                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDateTime toDate,
                                                                         @RequestParam(value = "page", defaultValue = "0") @Min(0) int page,
                                                                         @RequestParam(value = "size", defaultValue = "10") @Min(1) @Max(1000) int size,
                                                                         @RequestParam(value = "sortBy", defaultValue = "createdDate") String sortBy,
                                                                         @RequestParam(value = "sortOrder", defaultValue = "desc") String sortOrder) {
        Page<AutoFeedbackLLMEntryResponse> response= autoFeedbackLLMJobService.getAutoFeedbackLLMEntries(jobId,studentInfo,fromDate,toDate,page,size,sortBy,sortOrder);
        return ApiResponse.<Page<AutoFeedbackLLMEntryResponse>>builder()
                .result(response)
                .build();
    }
}
