package com.defty.question_bank_service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DirectionContentDTO {
    private String directionText;
    private String audioUrl; // null cho Reading parts
}