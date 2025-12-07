package com.defty.question_bank_service.dto.internal;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestSetInfo {
    @JsonProperty("test_name")
    private String testName;

    private String description;
}