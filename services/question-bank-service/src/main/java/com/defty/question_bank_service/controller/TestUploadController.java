//package com.defty.question_bank_service.controller;
////import com.defty.common_library.file.ServerFileService;
//import com.defty.question_bank_service.dto.request.QuestionGroupOrderRequest;
//import com.defty.question_bank_service.dto.request.TestSetRequest;
//import com.defty.question_bank_service.dto.response.QuestionGroupResponse;
//import com.defty.question_bank_service.dto.response.TestSetDetailResponse;
//import com.defty.question_bank_service.dto.response.TestSetQuestionOrderResponse;
//import com.defty.question_bank_service.dto.response.TestSetResponse;
//import com.defty.question_bank_service.dto.response.client.TestSetOverviewResponse;
//import com.defty.question_bank_service.dto.response.client.TestSetQuestionsResponse;
//import com.defty.question_bank_service.enums.Status;
//import com.defty.question_bank_service.enums.ToeicPart;
//import com.defty.question_bank_service.service.ITestSetService;
//import com.defty.common_library.dto.response.ApiResponse;
//import com.defty.common_library.dto.response.PageableResponse;
//import jakarta.validation.Valid;
//import jakarta.validation.constraints.Max;
//import jakarta.validation.constraints.Min;
//import jakarta.validation.constraints.NotEmpty;
//import lombok.AccessLevel;
//import lombok.AllArgsConstructor;
//import lombok.RequiredArgsConstructor;
//import lombok.experimental.FieldDefaults;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.data.domain.Page;
//import org.springframework.data.domain.Pageable;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.access.prepost.PreAuthorize;
//import org.springframework.web.bind.annotation.*;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.web.bind.annotation.RequestMapping;
//import org.springframework.web.bind.annotation.RestController;
//import org.springframework.web.multipart.MultipartFile;
//
//import java.io.IOException;
//
//@RestController
//@Slf4j
//@RequiredArgsConstructor
//@RequestMapping("/test-upload")
//@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
//public class TestUploadController {
//
////    ServerFileService serverFileService;
//
//    @PostMapping("/accessible/upload")
//    public ResponseEntity<String> upload(@RequestParam MultipartFile file) throws IOException {
////        String path = serverFileService.saveFile(file);
////        return ResponseEntity.ok(path);
//        return null;
//    }
//}