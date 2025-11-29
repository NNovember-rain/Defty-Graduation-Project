package com.defty.question_bank_service.dto.response.client;

import com.defty.question_bank_service.enums.DifficultyLevel;
import lombok.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class QuestionMinimalDTO {
    @EqualsAndHashCode.Include
    private UUID id;
    private Integer questionNumber;
    private String questionText;
    private List<AnswerMinimalDTO> answers;
}