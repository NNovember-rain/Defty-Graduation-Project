package com.defty.question_bank_service.dto.request;

import com.defty.question_bank_service.enums.DifficultyLevel;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class QuestionBulkRequest {
    private UUID id;

    @NotNull(message = "Question number must not be null")
    private Integer questionNumber;

    @Size(min = 1, max = 5000, message = "Question text must be between 1 and 5000 characters")
    private String questionText;

    @NotNull(message = "Difficulty level must not be null")
    private DifficultyLevel difficulty;

    @Valid
    @NotEmpty(message = "Must have at least one answer")
    @Size(min = 2, max = 10, message = "Must have between 2 and 10 answers")
    private List<AnswerBulkRequest> answers;

    private List<UUID> tagIds;
}