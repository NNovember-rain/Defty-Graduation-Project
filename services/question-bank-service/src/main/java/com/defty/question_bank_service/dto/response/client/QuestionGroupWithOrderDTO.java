package com.defty.question_bank_service.dto.response.client;

import com.defty.question_bank_service.entity.QuestionGroupEntity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class QuestionGroupWithOrderDTO {
    private QuestionGroupEntity questionGroup;
    private Integer questionPartOrder;
}