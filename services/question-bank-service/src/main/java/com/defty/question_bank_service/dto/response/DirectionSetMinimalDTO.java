package com.defty.question_bank_service.dto.response;

import com.defty.question_bank_service.dto.request.DirectionContentDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DirectionSetMinimalDTO {
    private UUID id;
    private Map<String, DirectionContentDTO> directions;
}
