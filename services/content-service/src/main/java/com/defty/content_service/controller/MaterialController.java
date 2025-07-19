package com.defty.content_service.controller;

import com.defty.content_service.dto.request.MaterialRequest;
import com.defty.content_service.dto.request.MaterialUploadRequest;
import com.defty.content_service.dto.response.ApiResponse;
import com.defty.content_service.dto.response.MaterialResponse;
import com.defty.content_service.dto.response.MaterialUploadResponse;
import com.defty.content_service.service.MaterialService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/materials")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MaterialController {

    MaterialService materialService;

    @PostMapping("/upload")
    ApiResponse<MaterialUploadResponse> uploadMaterial(@ModelAttribute MaterialUploadRequest request)
            throws IOException {
        MaterialUploadResponse response = materialService.uploadMaterial(request);
        return ApiResponse.<MaterialUploadResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping
    ApiResponse<Page<MaterialUploadResponse>> getAllMaterials(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "format", required = false) String format,
            @RequestParam(value = "title", required = false) String title
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdDate").descending());
        Page<MaterialUploadResponse> result = materialService.getAllMaterials(type, format, title, pageable);
        return ApiResponse.<Page<MaterialUploadResponse>>builder()
                .result(result)
                .build();
    }

    @PostMapping("/assign")
    ApiResponse<MaterialResponse> assignMaterialToClasses(@RequestBody MaterialRequest request) {
        MaterialResponse response = materialService.assignMaterialToClasses(request);
        return ApiResponse.<MaterialResponse>builder()
                .result(response)
                .build();
    }

    @PostMapping("/unassign")
    ApiResponse<MaterialResponse> unassignMaterialToClasses(@RequestBody MaterialRequest request) {
        MaterialResponse response = materialService.unassignMaterialFromClasses(request);
        return ApiResponse.<MaterialResponse>builder()
                .result(response)
                .build();
    }

}
