package com.submission_service.service.impl;

import com.submission_service.model.dto.request.FeedbackTeacherRequest;
import com.submission_service.model.dto.response.FeedbackTeacherResponse;
import com.submission_service.model.entity.FeedbackTeacher;
import com.submission_service.model.entity.Submission;
import com.submission_service.repository.IFeedbackTeacherRepository;
import com.submission_service.repository.ISubmissionRepository;
import com.submission_service.service.IFeedBackTeacherService;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Getter
@Setter
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Service
public class FeedBackTeacherServiceImpl implements IFeedBackTeacherService {

    IFeedbackTeacherRepository feedbackTeacherRepository;
    ISubmissionRepository submissionRepository;

    @Override
    public Long addFeedbackTeacher(FeedbackTeacherRequest feedbackTeacherRequest) {
        Submission submission = submissionRepository.findById(feedbackTeacherRequest.getSubmissionId())
                .orElseThrow(() -> new RuntimeException("Submission not found"));
        FeedbackTeacher feedbackTeacher = new FeedbackTeacher();
        BeanUtils.copyProperties(feedbackTeacherRequest, feedbackTeacher);
        feedbackTeacher=feedbackTeacherRepository.save(feedbackTeacher);
        submission.getFeedbackTeachers().add(feedbackTeacher);
        submissionRepository.save(submission);
        return feedbackTeacher.getId();
    }

    @Override
    public String updateFeedbackTeacher(Long id, FeedbackTeacherRequest feedbackTeacherRequest) {
        FeedbackTeacher feedbackTeacher = feedbackTeacherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("FeedbackTeacher not found"));
        BeanUtils.copyProperties(feedbackTeacherRequest, feedbackTeacher, "id", "createdDate");
        feedbackTeacherRepository.save(feedbackTeacher);
        return "FeedbackTeacher updated successfully";
    }

    @Override
    public List<FeedbackTeacherResponse> getFeedbackTeacher(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));
        List<FeedbackTeacher> feedbackTeacher=submission.getFeedbackTeachers();
        return feedbackTeacher.stream().map(ft -> {
            FeedbackTeacherResponse response = new FeedbackTeacherResponse();
            response.setId(ft.getId());
            response.setTeacherId(ft.getTeacherId());
            response.setContent(ft.getContent());
            return response;
        }).toList();
    }

}
