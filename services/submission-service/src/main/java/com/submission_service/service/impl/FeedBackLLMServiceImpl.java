package com.submission_service.service.impl;


import com.example.common_library.exceptions.NotFoundException;
import com.submission_service.model.dto.request.FeedbackLLMRequest;
import com.submission_service.model.dto.response.FeedbackLLMResponse;
import com.submission_service.model.entity.FeedbackLLM;
import com.submission_service.model.entity.Submission;
import com.submission_service.repository.IFeedBackLLMRepository;
import com.submission_service.repository.IFeedbackSubmissionRepository;
import com.submission_service.repository.ISubmissionRepository;
import com.submission_service.service.IFeedBackLLMService;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

@Getter
@Setter
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Service
public class FeedBackLLMServiceImpl implements IFeedBackLLMService {

    IFeedBackLLMRepository feedBackAIRepository;
    IFeedbackSubmissionRepository feedbackTeacherRepository;
    ISubmissionRepository submissionRepository;

    //TODO:xem lai mapper, them trace log

    @Override
    @Transactional
    public Long addFeedbackLLM(FeedbackLLMRequest feedbackLLMRequest) {
        FeedbackLLM feedbackLLM = new FeedbackLLM();
        Submission submission = submissionRepository.findById(feedbackLLMRequest.getSubmissionId())
                .orElseThrow(() -> new NotFoundException("Submission not found"));
        feedbackLLM.setFeedback(feedbackLLMRequest.getFeedback());
        feedbackLLM.setAiModalName(feedbackLLMRequest.getAiModalName());
        feedbackLLM = feedBackAIRepository.save(feedbackLLM);
        submission.setFeedbackLLM(feedbackLLM);
//        if (submission.getSubmissionStatus() != SubmissionStatus.FAILED) {
//            submission.setSubmissionStatus(SubmissionStatus.COMPLETED);
//        }
        submissionRepository.save(submission);
        return feedbackLLM.getId();
    }

    @Override
    public FeedbackLLMResponse getFeedbackLLM(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new NotFoundException("Submission not found"));
        FeedbackLLM feedbackLLM =submission.getFeedbackLLM();
        if(feedbackLLM != null) {
            FeedbackLLMResponse feedbackLLMResponse = new FeedbackLLMResponse();
            BeanUtils.copyProperties(feedbackLLM, feedbackLLMResponse);
            feedbackLLMResponse.setId(feedbackLLM.getId());
            return feedbackLLMResponse;
        }else throw new NotFoundException("Feeback AI not found or not exist for this submission");
    }


}
