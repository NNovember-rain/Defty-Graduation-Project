package com.defty.question_bank_service.dto.response.client;

import com.defty.question_bank_service.enums.DifficultyLevel;
import com.defty.question_bank_service.enums.ToeicPart;
import lombok.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class QuestionGroupMinimalDTO {
    @EqualsAndHashCode.Include
    private UUID id;
    private ToeicPart questionPart;
    private Integer questionGroupOrder;
    private String passageText;
    private List<FileMinimalDTO> files;
    private List<QuestionMinimalDTO> questions;
}