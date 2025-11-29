package com.defty.question_bank_service.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class AnswerRequest {

    @Size(min = 0, max = 2000, message = "Answer content must be between 1 and 2000 characters")
    private String content;

    @NotNull(message = "Answer order must not be null")
    private Integer answerOrder;

    @NotNull(message = "isCorrect must not be null")
    private Boolean isCorrect;

    @NotNull(message = "Question ID must not be null")
    private UUID questionId;
}