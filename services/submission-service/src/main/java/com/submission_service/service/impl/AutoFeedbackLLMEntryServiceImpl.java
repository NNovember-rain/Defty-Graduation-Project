package com.submission_service.service.impl;

import com.submission_service.mapper.AutoFeedbackLLMEntryMapper;
import com.submission_service.model.dto.response.AutoFeedbackLLMEntryResponse;
import com.submission_service.model.entity.AutoFeedbackLLMEntry;
import com.submission_service.model.entity.AutoFeedbackLLMEntry;
import com.submission_service.repository.AutoFeedbackLLMEntryRepository;
import com.submission_service.repository.specification.AutoFeedbackLLMEntrySpecification;
import com.submission_service.repository.specification.AutoFeedbackLLMJobSpecification;
import com.submission_service.service.AutoFeedbackLLMEntryService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class AutoFeedbackLLMEntryServiceImpl implements AutoFeedbackLLMEntryService {
    AutoFeedbackLLMEntryMapper autoFeedbackLLMEntryMapper;
    AutoFeedbackLLMEntryRepository autoFeedbackLLMEntryRepository;

    @Override
    public Page<AutoFeedbackLLMEntryResponse> getAutoFeedbackLLMEntries(Long jobId, String studentInfo, LocalDateTime fromDate, LocalDateTime toDate, int page, int size, String sortBy, String sortOrder) {
        Sort.Direction direction = sortOrder.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sort = switch (sortBy) {
            default -> Sort.by(direction, "createdDate");
        };

        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<AutoFeedbackLLMEntry> spec = Specification
                .where(AutoFeedbackLLMEntrySpecification.hasAutoFeedBackLLMJobId(jobId)
                .and(AutoFeedbackLLMEntrySpecification.notDeleted())
                .and(AutoFeedbackLLMEntrySpecification.hasStudentInfo(studentInfo)
                .and(AutoFeedbackLLMEntrySpecification.hasCreatedDateBetween(fromDate, toDate))));
        Page<AutoFeedbackLLMEntry> autoFeedbackLLMEntries = autoFeedbackLLMEntryRepository.findAll(spec, pageable);
        return autoFeedbackLLMEntries.map(autoFeedbackLLMEntryMapper::toAutoFeedbackLLMJobResponse);
    }
}
