package com.defty.question_bank_service.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class AssignTestSetsRequest {

    @NotEmpty(message = "Danh sách lớp học không được rỗng")
    private List<Long> classIds;

    @NotEmpty(message = "Danh sách bài test không được rỗng")
    private List<TestSetAssignment> testSets;

    @Data
    public static class TestSetAssignment {
        @NotNull(message = "ID bài test không được null")
        private UUID testSetId;

        private LocalDateTime startDate;
        private LocalDateTime endDate;
    }
}