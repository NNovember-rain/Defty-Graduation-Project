package com.defty.question_bank_service.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class QuestionGroupBulkRequest {
    @Valid
    @NotNull(message = "Question group info must not be null")
    private QuestionGroupRequest questionGroup;

    @Valid
    @NotEmpty(message = "Must have at least one question")
    private List<QuestionBulkRequest> questions;

    @Valid
    private List<FileBulkRequest> files;
}