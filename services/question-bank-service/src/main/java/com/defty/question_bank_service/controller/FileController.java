package com.defty.question_bank_service.controller;

import com.defty.question_bank_service.dto.response.ApiResponse;
import com.defty.question_bank_service.dto.response.FileResponse;
import com.defty.question_bank_service.enums.FileType;
import com.defty.question_bank_service.enums.Status;
import com.defty.question_bank_service.service.IFileService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/files")
@Validated
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FileController {

    IFileService fileService;

//    @PreAuthorize("hasPermission(null, 'file.view.all')")
    @GetMapping
    public ApiResponse<Page<FileResponse>> getFiles(
            @RequestParam(required = false) UUID groupId,
            @RequestParam(required = false) Status status,
            @RequestParam(value = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(value = "limit", defaultValue = "10")
            @Min(value = 1, message = "Limit must be at least 1")
            @Max(value = 1000, message = "Limit cannot exceed 1000") int limit
    ) {
        Pageable pageable = PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "createdDate"));
        return new ApiResponse<>(200, null, fileService.get(groupId, status, pageable));
    }

//    @PreAuthorize("hasPermission(null, 'file.view')")
    @GetMapping("/{id}")
    public ApiResponse<FileResponse> getFileById(@PathVariable UUID id) {
        return new ApiResponse<>(200, null, fileService.getById(id));
    }

//    @PreAuthorize("hasPermission(null, 'file.create')")
    @PostMapping(value = "", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<FileResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") @NotNull FileType type,
            @RequestParam("questionGroupId") @NotNull UUID questionGroupId,
            @RequestParam(value = "displayOrder", required = false) Integer displayOrder
    ) throws IOException {
        FileResponse response = fileService.create(file, type, questionGroupId, displayOrder);
        return new ApiResponse<>(200, "File uploaded successfully", response);
    }

//    @PreAuthorize("hasPermission(null, 'file.update')")
    @PatchMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<FileResponse> updateFile(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") @NotNull FileType type,
            @RequestParam("questionGroupId") @NotNull UUID questionGroupId,
            @RequestParam(value = "displayOrder", required = false) Integer displayOrder
    ) throws IOException {
        FileResponse response = fileService.update(id, file, type, questionGroupId, displayOrder);
        return new ApiResponse<>(200, "File updated successfully", response);
    }

//    @PreAuthorize("hasPermission(null, 'file.delete')")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteFile(@PathVariable UUID id) {
        fileService.softDelete(id);
        return new ApiResponse<>(200, "File deleted successfully", null);
    }

//    @PreAuthorize("hasPermission(null, 'file.update')")
    @PatchMapping("/{id}/toggle-status")
    public ApiResponse<FileResponse> toggleStatus(@PathVariable UUID id) {
        return new ApiResponse<>(200, "File status toggled successfully", fileService.toggleStatus(id));
    }
}