package com.defty.question_bank_service.dto.internal;

import com.defty.question_bank_service.enums.ToeicPart;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionGroup {
    @JsonProperty("question_part")
    private ToeicPart questionPart;

    @JsonProperty("audio_transcript")
    private String audioTranscript;

    private List<Question> questions;
}