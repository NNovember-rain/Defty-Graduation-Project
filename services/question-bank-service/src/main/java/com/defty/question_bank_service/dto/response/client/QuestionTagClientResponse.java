package com.defty.question_bank_service.dto.response.client;

import com.defty.question_bank_service.dto.response.BaseResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionTagClientResponse extends BaseResponse {
    private UUID id;
    private String tagName;
    private String description;
}
