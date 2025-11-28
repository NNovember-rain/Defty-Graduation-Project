package com.defty.question_bank_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestSetDetailResponse {
    private TestSetResponse testSet;
    private List<QuestionGroupResponse> questionGroups;
}
