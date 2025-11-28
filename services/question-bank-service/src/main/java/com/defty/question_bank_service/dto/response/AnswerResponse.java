package com.defty.question_bank_service.dto.response;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class AnswerResponse extends BaseResponse {
    @EqualsAndHashCode.Include
    private UUID id;
    private String content;
    private Integer answerOrder;
    private Boolean isCorrect;
    private UUID questionId;
}