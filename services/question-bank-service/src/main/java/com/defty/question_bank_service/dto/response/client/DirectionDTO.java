package com.defty.question_bank_service.dto.response.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DirectionDTO {
    private String directionText;
    private String audioUrl; // null nếu là Reading Part
}