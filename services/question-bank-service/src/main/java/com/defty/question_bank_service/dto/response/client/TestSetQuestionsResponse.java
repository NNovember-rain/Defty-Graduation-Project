package com.defty.question_bank_service.dto.response.client;

import com.defty.question_bank_service.dto.response.DirectionSetMinimalDTO;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class TestSetQuestionsResponse {
    private UUID testSetId;
    private String testSetSlug;
    private String testName;
    private List<QuestionGroupMinimalDTO> questionGroups;
    private DirectionSetMinimalDTO directionSet;
}
