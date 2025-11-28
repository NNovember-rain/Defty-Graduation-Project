//package com.defty.question_bank_service.controller;
//
//import com.defty.question_bank_service.dto.request.FileProcessingRequest;
//import com.defty.question_bank_service.dto.response.FileProcessingResponse;
//import com.defty.question_bank_service.service.IFileProcessingService;
//import com.defty.question_bank_service.dto.response.ApiResponse;
//import com.defty.question_bank_service.dto.response.PageableResponse;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.data.domain.Pageable;
//import org.springframework.http.MediaType;
////import org.springframework.security.access.prepost.PreAuthorize;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.List;
//import java.util.UUID;
//
//@RestController
//@Slf4j
//@RequiredArgsConstructor
//@RequestMapping("/file-processing")
//public class FileProcessingController {
//
//    private final IFileProcessingService fileProcessingService;
//
//    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
////    @PreAuthorize("hasPermission(null, 'file.processing.upload')")
//    public ApiResponse<UUID> uploadTestFile(@ModelAttribute FileProcessingRequest fileProcessingRequest) {
//
//        log.info("Request to upload file for testSetId: {}, partType: {}", fileProcessingRequest.getTestSetId(), fileProcessingRequest.getPartType());
//
//        UUID uploadId = fileProcessingService.uploadTestFile(fileProcessingRequest);
//        return new ApiResponse<>(201, "File đang được xử lý", uploadId);
//    }
//    @DeleteMapping("/{ids}")
////    @PreAuthorize("hasPermission(null, 'file.processing.delete')")
//    public ApiResponse<List<UUID>> deleteProcessings(@PathVariable List<UUID> ids) {
//        List<UUID> deletedIds = fileProcessingService.deleteProcessings(ids);
//        return new ApiResponse<>(200, "Xóa bản ghi xử lý thành công", deletedIds);
//    }
//    @GetMapping("/{id}")
//////    @PreAuthorize("hasPermission(null, 'file.processing.view')")
//    public ApiResponse<FileProcessingResponse> getProcessingById(@PathVariable UUID id) {
//        FileProcessingResponse response = fileProcessingService.getProcessingById(id);
//        return new ApiResponse<>(200, "Lấy trạng thái xử lý thành công", response);
//    }
//
//    @GetMapping("")
//////    @PreAuthorize("hasPermission(null, 'file.processing.view')")
//    public ApiResponse<PageableResponse<FileProcessingResponse>> getFileProcessings(
//            Pageable pageable,
//            @RequestParam(name = "test_set_id", required = false) UUID testSetId,
//            @RequestParam(name = "part_type", required = false) String partType,
//            @RequestParam(name = "status", required = false) Integer status) {
//
//        PageableResponse<FileProcessingResponse> response = fileProcessingService.getFileProcessings(
//                pageable, testSetId, partType, status);
//        return new ApiResponse<>(200, "Lấy danh sách xử lý file thành công", response);
//    }
//
////    @GetMapping("/test-set/{testSetId}")
//////    @PreAuthorize("hasPermission(null, 'file.processing.view')")
////    public ApiResponse<List<FileProcessingResponse>> getProcessingsByTestSet(@PathVariable UUID testSetId) {
////        List<FileProcessingResponse> responses = fileProcessingService.getProcessingsByTestSet(testSetId);
////        return new ApiResponse<>(200, "Lấy danh sách xử lý theo bộ đề thành công", responses);
////    }
//
//    @PatchMapping("/{id}/resolve")
////    @PreAuthorize("hasPermission(null, 'file.processing.resolve')")
//    public ApiResponse<UUID> markAsResolved(@PathVariable UUID id) {
//
//        UUID resolvedId = fileProcessingService.markAsResolved(id);
//        return new ApiResponse<>(200, "Đánh dấu đã xử lý thủ công thành công", resolvedId);
//    }
//    @PatchMapping("/{id}/cancel")
////    @PreAuthorize("hasPermission(null, 'file.processing.cancel')")
//    public ApiResponse<UUID> cancelProcessing(@PathVariable UUID id) {
//        UUID cancelledId = fileProcessingService.cancelProcessing(id);
//        return new ApiResponse<>(200, "Hủy xử lý file thành công", cancelledId);
//    }
//}