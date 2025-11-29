package com.defty.question_bank_service.dto.request;

import com.defty.question_bank_service.enums.DifficultyLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class QuestionRequest {

    @NotNull(message = "Question number must not be null")
    private Integer questionNumber;

    @Size(min = 1, max = 5000, message = "Question text must be between 1 and 5000 characters")
    private String questionText;

    @NotNull(message = "Difficulty level must not be null")
    private DifficultyLevel difficulty;

    @NotNull(message = "Question group id must not be null")
    private UUID questionGroupId;
}