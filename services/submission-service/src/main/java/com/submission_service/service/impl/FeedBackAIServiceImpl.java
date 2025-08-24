package com.submission_service.service.impl;


import com.example.common_library.exceptions.NotFoundException;
import com.submission_service.model.dto.request.FeedbackAiRequest;
import com.submission_service.model.dto.request.FeedbackTeacherRequest;
import com.submission_service.model.dto.response.FeedbackAIResponse;
import com.submission_service.model.dto.response.FeedbackTeacherResponse;
import com.submission_service.model.entity.FeedbackAi;
import com.submission_service.model.entity.FeedbackTeacher;
import com.submission_service.model.entity.Submission;
import com.submission_service.repository.IFeedBackAiRepository;
import com.submission_service.repository.IFeedbackTeacherRepository;
import com.submission_service.repository.ISubmissionRepository;
import com.submission_service.service.IFeedBackAIService;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Getter
@Setter
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Service
public class FeedBackAIServiceImpl implements IFeedBackAIService {

    IFeedBackAiRepository feedBackAIRepository;
    IFeedbackTeacherRepository feedbackTeacherRepository;
    ISubmissionRepository submissionRepository;

    //TODO:xem lai mapper, them trace log

    @Override
    @Transactional
    public Long addFeedbackAI(FeedbackAiRequest feedbackAiRequest) {
        FeedbackAi feedbackAi=new FeedbackAi();
        Submission submission = submissionRepository.findById(feedbackAiRequest.getSubmissionId())
                .orElseThrow(() -> new NotFoundException("Submission not found"));
        feedbackAi.setFeedback(feedbackAiRequest.getFeedback());
        feedbackAi.setAiModalName(feedbackAiRequest.getAiModalName());
        feedbackAi=feedBackAIRepository.save(feedbackAi);
        submission.setFeedbackAi(feedbackAi);
        submissionRepository.save(submission);
        return feedbackAi.getId();
    }

    @Override
    public FeedbackAIResponse getFeedbackAI(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new NotFoundException("Submission not found"));
        FeedbackAi feedbackAi=submission.getFeedbackAi();
        if(feedbackAi != null) {
            FeedbackAIResponse feedbackAIResponse = new FeedbackAIResponse();
            BeanUtils.copyProperties(feedbackAi, feedbackAIResponse);
            feedbackAIResponse.setId(feedbackAi.getId());
            return feedbackAIResponse;
        }else throw new NotFoundException("Feeback AI not found or not exist for this submission");
    }


}
