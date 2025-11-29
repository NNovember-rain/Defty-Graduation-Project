package com.defty.question_bank_service.dto.response;

import com.defty.question_bank_service.enums.DifficultyLevel;
import lombok.*;

import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class QuestionResponse extends BaseResponse {
    @EqualsAndHashCode.Include
    private UUID id;
    private Integer questionNumber;
    private String questionText;
    private DifficultyLevel difficulty;
    private UUID questionGroupId;

    private Set<QuestionTagResponse> tags;
    private Set<AnswerResponse> answers;
}