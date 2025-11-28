package com.defty.question_bank_service.controller;
import com.defty.question_bank_service.dto.request.QuestionTagRequest;
import com.defty.question_bank_service.dto.response.QuestionTagResponse;
import com.defty.question_bank_service.service.IQuestionTagService;
import com.defty.question_bank_service.dto.response.ApiResponse;
import com.defty.question_bank_service.dto.response.PageableResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
//import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
@RestController
@Slf4j
@RequiredArgsConstructor
@RequestMapping("/question-tags")
public class QuestionTagController {

    private final IQuestionTagService questionTagService;

    @PostMapping("")
//    @PreAuthorize("hasPermission(null, 'question.tag.create')")
    public ApiResponse<UUID> createQuestionTag(@Valid @RequestBody QuestionTagRequest request) {
        UUID id = questionTagService.createQuestionTag(request);
        return new ApiResponse<>(201, "Tạo thẻ câu hỏi thành công", id);
    }

    @GetMapping("/{id}")
//    @PreAuthorize("hasPermission(null, 'question.tag.view')")
    public ApiResponse<QuestionTagResponse> getQuestionTagById(@PathVariable UUID id) {
        QuestionTagResponse response = questionTagService.getQuestionTagById(id);
        return new ApiResponse<>(200, "Lấy thông tin thẻ câu hỏi thành công", response);
    }

    @GetMapping("")
//    @PreAuthorize("hasPermission(null, 'question.tag.view')")
    public ApiResponse<PageableResponse<QuestionTagResponse>> getQuestionTags(
            Pageable pageable,
            @RequestParam(name = "tag_name", required = false) String tagName,
            @RequestParam(name = "tag_category", required = false) String tagCategory,
            @RequestParam(name = "status", required = false) Integer status) {

        PageableResponse<QuestionTagResponse> response = questionTagService.getQuestionTags(pageable, tagName, tagCategory, status);
        return new ApiResponse<>(200, "Lấy danh sách thẻ câu hỏi thành công", response);
    }

    @GetMapping("/active")
    public ApiResponse<List<QuestionTagResponse>> getAllActiveTags() {
        List<QuestionTagResponse> responses = questionTagService.getAllActiveTags();
        return new ApiResponse<>(200, "Lấy danh sách thẻ hoạt động thành công", responses);
    }

    @PutMapping("/{id}")
//    @PreAuthorize("hasPermission(null, 'question.tag.update')")
    public ApiResponse<UUID> updateQuestionTag(@PathVariable UUID id, @Valid @RequestBody QuestionTagRequest request) {
        UUID updatedId = questionTagService.updateQuestionTag(id, request);
        return new ApiResponse<>(200, "Cập nhật thẻ câu hỏi thành công", updatedId);
    }

    @DeleteMapping("/{ids}")
//    @PreAuthorize("hasPermission(null, 'question.tag.delete')")
    public ApiResponse<List<UUID>> deleteQuestionTags(@PathVariable List<UUID> ids) {
        List<UUID> deletedIds = questionTagService.deleteQuestionTags(ids);
        return new ApiResponse<>(200, "Xóa thẻ câu hỏi thành công", deletedIds);
    }

    @PatchMapping("/toggle-status/{id}")
//    @PreAuthorize("hasPermission(null, 'question.tag.toggle.status')")
    public ApiResponse<UUID> toggleActiveStatus(@PathVariable UUID id) {
        UUID toggledId = questionTagService.toggleActiveStatus(id);
        return new ApiResponse<>(200, "Thay đổi trạng thái thẻ câu hỏi thành công", toggledId);
    }
}
