package com.defty.question_bank_service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionTagRequest {
//    @NotBlank(message = "Tag name is required")
//    @Size(max = 100, message = "Tag name must not exceed 100 characters")
    private String tagName;

//    @Size(max = 50, message = "Tag category must not exceed 50 characters")
    private String tagCategory;

//    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;
}