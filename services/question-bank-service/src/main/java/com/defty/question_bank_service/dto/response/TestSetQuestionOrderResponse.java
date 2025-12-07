package com.defty.question_bank_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestSetQuestionOrderResponse {
    private UUID questionGroupId;
    private Integer questionPartOrder;
}