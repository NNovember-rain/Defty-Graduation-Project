package com.defty.question_bank_service.dto.internal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AICallbackRequest {

    // Thông tin tracking
    private UUID uploadId;
    private String status; // SUCCESS, FAILED, PARTIAL_SUCCESS

    // Kết quả phân tích
    private AIProcessingResult result;

    // Thông tin lỗi (nếu có)
    private String errorCode;
    private String errorMessage;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AIProcessingResult {
        private Integer totalQuestionsFound;
        private List<QuestionData> questions;

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @Builder
        public static class QuestionData {
            private Integer questionNumber;
            private String partNumber; // "1", "2", "3"...
            private String questionText;
            private String audioScript; // Cho LC
            private String passage; // Cho RC
            private String imageUrl; // Nếu có hình ảnh
            private List<OptionData> options;
            private String correctAnswer; // "A", "B", "C", "D"
            private String explanation; // Giải thích đáp án
        }

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @Builder
        public static class OptionData {
            private String optionKey; // "A", "B", "C", "D"
            private String optionText;
        }
    }
}