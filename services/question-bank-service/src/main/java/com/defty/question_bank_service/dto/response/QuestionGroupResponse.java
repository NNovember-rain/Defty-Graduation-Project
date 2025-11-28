package com.defty.question_bank_service.dto.response;

import com.defty.question_bank_service.enums.DifficultyLevel;
import com.defty.question_bank_service.enums.QuestionSource;
import com.defty.question_bank_service.enums.ToeicPart;
import lombok.*;

import java.util.Set;
import java.util.UUID;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class QuestionGroupResponse extends BaseResponse {
    @EqualsAndHashCode.Include
    private UUID id;
    private ToeicPart questionPart;
    private Integer questionPartOrder;
    private String audioTranscript;
    private String explanation;
    private String passageText;
    private DifficultyLevel difficulty;
    private String notes;
    private Integer requiredImage;
    private Boolean requiredAudio;

    private QuestionSource source;
    private FileProcessingResponse sourceFileProcessing;

    private Set<QuestionTagResponse> tags;
    private Set<FileResponse> files;
    private Set<QuestionResponse> questions;
}