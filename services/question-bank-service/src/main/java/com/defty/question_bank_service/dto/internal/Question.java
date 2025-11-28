package com.defty.question_bank_service.dto.internal;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Question {
    @JsonProperty("question_number")
    private Integer questionNumber;

    @JsonProperty("question_text")
    private String questionText;

    private List<Answer> answers;
}