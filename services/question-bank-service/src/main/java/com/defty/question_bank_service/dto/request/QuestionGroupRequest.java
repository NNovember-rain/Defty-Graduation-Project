package com.defty.question_bank_service.dto.request;

import com.defty.question_bank_service.enums.DifficultyLevel;
import com.defty.question_bank_service.enums.ToeicPart;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class QuestionGroupRequest {
    @NotNull(message = "Toeic part must not be null")
    private ToeicPart questionPart;

    private Integer questionPartOrder;

    @Size(max = 10000, message = "Audio transcript must be <= 10000 characters")
    private String audioTranscript;

    @Size(max = 10000, message = "Explanation must be <= 10000 characters")
    private String explanation;

    @Size(max = 10000, message = "Passage text must be <= 10000 characters")
    private String passageText;

    @NotNull(message = "Difficulty level must not be null")
    private DifficultyLevel difficulty;

    @Size(max = 5000, message = "Notes must be <= 5000 characters")
    private String notes;

    private Integer requiredImage;
    private Boolean requiredAudio;
}