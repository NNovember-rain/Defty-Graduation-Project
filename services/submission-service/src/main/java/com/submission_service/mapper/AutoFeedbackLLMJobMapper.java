package com.submission_service.mapper;

import com.submission_service.model.dto.response.AutoFeedbackLLMJobResponse;
import com.submission_service.model.entity.AutoFeedbackLLMJob;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AutoFeedbackLLMJobMapper {
    AutoFeedbackLLMJobResponse toAutoFeedbackLLMJobResponse(AutoFeedbackLLMJob autoFeedbackLLMJob);
}
