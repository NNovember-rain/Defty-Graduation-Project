package com.defty.question_bank_service.dto.response.client;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class AnswerMinimalDTO {
    @EqualsAndHashCode.Include
    private UUID id;
    private String content;
    private Integer answerOrder;
}