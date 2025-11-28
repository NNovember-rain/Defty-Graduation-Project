package com.defty.question_bank_service.dto.response;

import com.defty.question_bank_service.dto.request.DirectionContentDTO;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DirectionSetResponse {
    private UUID id;
    private String directionSetName;
    private String description;
    @JsonProperty("isDefault")
    private boolean isDefault;
    private Map<String, DirectionContentDTO> directions;
    private Integer status;
    private LocalDateTime createdDate;
    private LocalDateTime modifiedDate;
}