package com.defty.question_bank_service.dto.internal;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Answer {
    private String content;
    private Integer order;

    @JsonProperty("is_correct")
    private Boolean isCorrect;
}