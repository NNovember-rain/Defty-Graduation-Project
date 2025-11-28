package com.defty.question_bank_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileProcessingResponse extends BaseResponse{
    private UUID id;
    private UUID testSetId;
    private String testSetName;
    private String partType;
    private Integer status;

    // 3. Thông tin Kết quả Xử lý
    private Integer totalQuestionsFound;
    private Integer questionsInserted;
    private Integer questionsDuplicated;
    private Integer questionsFailed;
    private Boolean manuallyResolved;

    // 4. Thông tin Lỗi & Xung đột
    private Integer existingQuestionsCount;
    private String errorMessage;
    private String issueDetails;
}