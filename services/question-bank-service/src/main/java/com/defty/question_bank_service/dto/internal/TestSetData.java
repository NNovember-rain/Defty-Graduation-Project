package com.defty.question_bank_service.dto.internal;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestSetData {
    @JsonProperty("test_set")
    private TestSetInfo testSet;

    @JsonProperty("test_question_groups")
    private List<TestQuestionGroupWrapper> testQuestionGroups;
}