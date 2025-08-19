package com.submission_service.service.impl;


import com.submission_service.model.dto.request.FeedbackAiRequest;
import com.submission_service.model.entity.FeedbackAi;
import com.submission_service.repository.IFeedBackAiRepository;
import com.submission_service.service.IFeedBackAIService;
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
public class FeedBackAIServiceImpl implements IFeedBackAIService {

    IFeedBackAiRepository feedBackAIRepository;

    @Override
    public Long addFeedback(FeedbackAiRequest feedbackAiRequest) {
        FeedbackAi feedbackAi=new FeedbackAi();
        feedbackAi.setSubmissionId(feedbackAiRequest.getSubmissionId());
        feedbackAi.setFeedback(feedbackAiRequest.getFeedback());
        feedbackAi.setAiModalName(feedbackAiRequest.getAiModalName());
        return feedBackAIRepository.save(feedbackAi).getId();
    }
}
