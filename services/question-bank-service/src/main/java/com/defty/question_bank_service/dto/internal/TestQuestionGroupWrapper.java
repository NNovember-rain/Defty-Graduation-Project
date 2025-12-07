package com.defty.question_bank_service.dto.internal;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestQuestionGroupWrapper {
    @JsonProperty("question_group_order")
    private Integer questionGroupOrder;

    @JsonProperty("question_group")
    private QuestionGroup questionGroup;
}