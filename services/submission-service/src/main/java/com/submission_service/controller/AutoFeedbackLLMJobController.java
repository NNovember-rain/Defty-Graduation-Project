package com.submission_service.controller;

import com.example.common_library.response.ApiResponse;
import com.submission_service.enums.TypeUml;
import com.submission_service.model.dto.response.AutoFeedbackLLMJobDetailResponse;
import com.submission_service.model.dto.response.AutoFeedbackLLMJobResponse;
import com.submission_service.model.entity.AutoFeedbackLLMJob;
import com.submission_service.service.AutoFeedbackLLMJobService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/submission/excel-job")
@RequiredArgsConstructor
@Validated
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AutoFeedbackLLMJobController {

    AutoFeedbackLLMJobService autoFeedbackLLMJobService;

    @PostMapping()
    ApiResponse<Long> addAutoFeedbackLLMJob(@RequestPart MultipartFile file) {
        Long response= autoFeedbackLLMJobService.handaleAutoFeedbackLLMJob(file);
        return ApiResponse.<Long>builder()
                .result(response)
                .build();
    }

    @GetMapping("/{jobId}")
    ApiResponse<AutoFeedbackLLMJobDetailResponse> getAutoFeedbackLLMEntryByJobId(@PathVariable Long jobId) {
        AutoFeedbackLLMJobDetailResponse response= autoFeedbackLLMJobService.getAutoFeedbackLLMJobDetail(jobId);
        return ApiResponse.<AutoFeedbackLLMJobDetailResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping()
    ApiResponse<Page<AutoFeedbackLLMJobResponse>> getAutoFeedbackLLMJobs(@RequestParam(required = false) String title,
                                             @RequestParam(required = false) TypeUml typeUml,
                                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDateTime fromDate,
                                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDateTime toDate,
                                             @RequestParam(value = "page", defaultValue = "0") @Min(0) int page,
                                             @RequestParam(value = "size", defaultValue = "10") @Min(1) @Max(1000) int size,
                                             @RequestParam(value = "sortBy", defaultValue = "createdDate") String sortBy,
                                             @RequestParam(value = "sortOrder", defaultValue = "desc") String sortOrder) {
        Page<AutoFeedbackLLMJobResponse> response= autoFeedbackLLMJobService.getAutoFeedbackLLMJobs(title,typeUml,fromDate,toDate,page,size,sortBy,sortOrder);
        return ApiResponse.<Page<AutoFeedbackLLMJobResponse>>builder()
                .result(response)
                .build();
    }

    @DeleteMapping("/{jobIds}")
    ApiResponse<String> deleteAutoFeedbackLLMJobs(@PathVariable List<Long> jobIds) {
        String message=autoFeedbackLLMJobService.deleteAutoFeedbackLLMJobs(jobIds);
        return ApiResponse.<String>builder()
                .result(message)
                .build();
    }

}
