package com.defty.question_bank_service.dto.response.client;

import com.defty.question_bank_service.enums.ToeicPart;
import lombok.Builder;
import lombok.Data;

import java.util.Map;
import java.util.UUID;
@Data
@Builder
public class TestSetOverviewResponse {
    private UUID id;
    private String testName;
    private String slug;
    private Integer testNumber;
    private String description;
    private String collectionName;
    private Integer totalQuestions;
    private Integer duration;
    private Boolean isTaken;
    private Long attemptCount;
    private Long commentCount;

    // Chỉ cần thống kê số lượng câu hỏi theo part
    private Map<ToeicPart, Integer> partQuestionCount;
}
