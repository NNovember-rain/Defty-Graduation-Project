package com.defty.question_bank_service.dto.request;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UpdateAssignmentRequest {
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean isActive;
}
