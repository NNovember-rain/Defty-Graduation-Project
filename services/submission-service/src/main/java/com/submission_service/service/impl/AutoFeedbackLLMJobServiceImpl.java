package com.submission_service.service.impl;

import com.example.common_library.exceptions.NotFoundException;
import com.submission_service.mapper.AutoFeedbackLLMEntryMapper;
import com.submission_service.mapper.AutoFeedbackLLMJobMapper;
import com.submission_service.model.dto.response.AutoFeedbackLLMEntryResponse;
import com.submission_service.model.dto.response.AutoFeedbackLLMJobDetailResponse;
import com.submission_service.model.dto.response.AutoFeedbackLLMJobResponse;
import com.submission_service.model.entity.AutoFeedbackLLMEntry;
import com.submission_service.model.entity.AutoFeedbackLLMJob;
import com.submission_service.enums.TypeUml;
import com.submission_service.repository.AutoFeedbackLLMJobRepository;
import com.submission_service.repository.AutoFeedbackLLMEntryRepository;
import com.submission_service.repository.specification.AutoFeedbackLLMJobSpecification;
import com.submission_service.service.AutoFeedbackLLMJobService;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class AutoFeedbackLLMJobServiceImpl implements AutoFeedbackLLMJobService {

    AutoFeedbackLLMJobRepository autoFeedbackLLMJobRepository;
    AutoFeedbackLLMEntryRepository autoFeedbackLLMEntryRepository;
    AutoFeedbackLLMJobMapper autoFeedbackLLMJobMapper;
    AutoFeedbackLLMEntryMapper autoFeedbackLLMEntryMapper;

    @Override
    public Long handaleAutoFeedbackLLMJob(MultipartFile file) {
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            // Đọc metadata job
            Map<String, String> meta = new LinkedHashMap<>();
            for (int i = 0; i < 4; i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                Cell key = row.getCell(0);
                Cell value = row.getCell(1);
                if (key != null && value != null) {
                    meta.put(key.getStringCellValue().trim(), value.toString().trim());
                }
            }

            AutoFeedbackLLMJob job = AutoFeedbackLLMJob.builder()
                    .title(meta.getOrDefault("Title", "Untitled"))
                    .assignment(meta.getOrDefault("Assignment", ""))
                    .solutionCode(meta.getOrDefault("Solution Code", ""))
                    .typeUml(parseType(meta.get("Type UML")))
                    .build();

            autoFeedbackLLMJobRepository.save(job);
            log.info("Saved AutoFeedbackLLMJob to DB: id={}, title={}", job.getId(), job.getTitle());

            // Đọc entries và lưu DB
            int count = 0;
            for (int i = 6; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String studentInfo = getCell(row, 0);
                String plantUMLCode = getCell(row, 1);

                if (plantUMLCode.isBlank() && studentInfo.isBlank()) continue;

                AutoFeedbackLLMEntry entry = AutoFeedbackLLMEntry.builder()
                        .autoFeedbackLLMJob(job)
                        .studentPlantUMLCode(plantUMLCode)
                        .studentInfo(studentInfo)
                        .build();

                autoFeedbackLLMEntryRepository.save(entry);
                count++;
            }

            log.info("Saved {} entries to DB for job id={}", count, job.getId());
            return job.getId();

        } catch (IOException e) {
            log.error("Error reading Excel file: {}", e.getMessage());
            throw new RuntimeException("Failed to read Excel file", e);
        }
    }

    private String getCell(Row row, int index) {
        try {
            Cell cell = row.getCell(index);
            if (cell == null) return "";
            cell.setCellType(CellType.STRING);
            return cell.getStringCellValue().trim();
        } catch (Exception e) {
            return "";
        }
    }

    private TypeUml parseType(String type) {
        if (type == null) return TypeUml.USE_CASE_DIAGRAM;
        try {
            return TypeUml.valueOf(type.toUpperCase());
        } catch (Exception e) {
            return TypeUml.USE_CASE_DIAGRAM;
        }
    }

    @Override
    public Page<AutoFeedbackLLMJobResponse> getAutoFeedbackLLMJobs(
            String title, TypeUml typeUml, LocalDateTime fromDate, LocalDateTime toDate,
            int page, int size, String sortBy, String sortOrder
    ) {
        Sort.Direction direction = sortOrder.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sort = Sort.by(direction, "createdDate");
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<AutoFeedbackLLMJob> spec = Specification
                .where(AutoFeedbackLLMJobSpecification.hasTitle(title))
                .and(AutoFeedbackLLMJobSpecification.notDeleted())
                .and(AutoFeedbackLLMJobSpecification.hasTypeUml(typeUml))
                .and(AutoFeedbackLLMJobSpecification.hasCreatedDateBetween(fromDate, toDate));

        Page<AutoFeedbackLLMJob> jobPage = autoFeedbackLLMJobRepository.findAll(spec, pageable);
        log.info("Queried AutoFeedbackLLMJobs from DB: found {} records (page {})", jobPage.getNumberOfElements(), page + 1);

        return jobPage.map(autoFeedbackLLMJobMapper::toAutoFeedbackLLMJobResponse);
    }

    @Override
    public AutoFeedbackLLMJobDetailResponse getAutoFeedbackLLMJobDetail(Long jobId) {
        AutoFeedbackLLMJob job = autoFeedbackLLMJobRepository.findById(jobId)
                .orElseThrow(() -> new NotFoundException("AutoFeedbackLLMJob not found with id: " + jobId));
        log.info("Fetched AutoFeedbackLLMJob from DB: id={}, title={}", job.getId(), job.getTitle());

        AutoFeedbackLLMJobDetailResponse response = AutoFeedbackLLMJobDetailResponse.builder()
                .title(job.getTitle())
                .assignment(job.getAssignment())
                .typeUml(job.getTypeUml())
                .solutionCode(job.getSolutionCode())
                .build();

        List<AutoFeedbackLLMEntry> entries = job.getEntries();
        entries.sort(Comparator.comparing(AutoFeedbackLLMEntry::getCreatedDate));

        List<AutoFeedbackLLMEntryResponse> entryResponses = entries.stream()
                .map(autoFeedbackLLMEntryMapper::toAutoFeedbackLLMJobResponse)
                .toList();

        response.setEntries(entryResponses);
        log.info("Fetched {} entries from DB for job id={}", entries.size(), job.getId());

        return response;
    }

    @Override
    public String deleteAutoFeedbackLLMJobs(List<Long> jobIds) {
        List<AutoFeedbackLLMJob> jobs = autoFeedbackLLMJobRepository.findAllById(jobIds);
        log.info("Retrieved {} AutoFeedbackLLMJobs from DB for deletion", jobs.size());

        for (AutoFeedbackLLMJob job : jobs) {
            job.setDeleted(true);
            List<AutoFeedbackLLMEntry> jobEntries = job.getEntries();
            jobEntries.forEach(entry -> entry.setDeleted(true));
            autoFeedbackLLMEntryRepository.saveAll(jobEntries);
            autoFeedbackLLMJobRepository.save(job);
        }

        log.info("Marked {} AutoFeedbackLLMJobs as deleted in DB", jobs.size());
        return "Deleted AutoFeedbackLLMJobs successfully.";
    }
}
