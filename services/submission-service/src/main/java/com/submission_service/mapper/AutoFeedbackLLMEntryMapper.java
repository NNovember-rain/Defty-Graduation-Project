package com.submission_service.mapper;

import com.submission_service.model.dto.response.AutoFeedbackLLMEntryResponse;
import com.submission_service.model.entity.AutoFeedbackLLMEntry;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AutoFeedbackLLMEntryMapper {
    AutoFeedbackLLMEntryResponse toAutoFeedbackLLMJobResponse(AutoFeedbackLLMEntry autoFeedbackLLMEntry);
}
