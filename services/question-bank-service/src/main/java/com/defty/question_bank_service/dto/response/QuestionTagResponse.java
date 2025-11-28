package com.defty.question_bank_service.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionTagResponse extends BaseResponse{
    private UUID id;
    private String tagName;
//    private String tagCategory;
    private String description;
}
