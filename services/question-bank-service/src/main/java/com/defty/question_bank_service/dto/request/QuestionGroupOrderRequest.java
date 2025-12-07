package com.defty.question_bank_service.dto.request;

import lombok.Data;

import java.util.UUID;

@Data
public class QuestionGroupOrderRequest {
    private UUID questionGroupId;
    private Integer questionPartOrder;
}