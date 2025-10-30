package com.submission_service.service.impl;

import com.example.common_library.exceptions.NotFoundException;
import com.submission_service.model.entity.Submission;
import com.submission_service.repository.ISubmissionRepository;
import com.submission_service.service.IActionScheduler;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Getter
@Setter
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Service
public class ActionSchedulerImpl implements IActionScheduler {
    TaskScheduler taskScheduler;
    ISubmissionRepository submissionRepository;

    public void checkSubmissionStatus(Long submissionId) {
        taskScheduler.schedule(
                () -> {
                    Submission submission = submissionRepository.findById(submissionId).orElseThrow(()-> new NotFoundException("Submission not found"));
                    if (submission.getSubmissionStatus().toString().equals("PROCESSING")) {
                        submission.setSubmissionStatus(com.submission_service.enums.SubmissionStatus.FAILED);
                        submissionRepository.save(submission);
                    }
                },
                Instant.now().plusSeconds(120)
        );
    }
}
