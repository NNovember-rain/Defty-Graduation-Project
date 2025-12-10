package com.submission_service.service.impl;

import com.example.common_library.exceptions.FeignClientException;
import com.example.common_library.exceptions.FieldRequiredException;
import com.example.common_library.utils.UserUtils;
import com.submission_service.client.AuthServiceClient;
import com.submission_service.client.ClassManagementServiceClient;
import com.submission_service.model.dto.request.FeedbackSubmissionRequest;
import com.submission_service.model.dto.response.SubmissionFeedbackResponse;
import com.submission_service.model.dto.response.UserResponse;
import com.submission_service.model.entity.SubmissionFeedback;
import com.submission_service.model.entity.Submission;
import com.submission_service.repository.IFeedbackSubmissionRepository;
import com.submission_service.repository.ISubmissionRepository;
import com.submission_service.service.IFeedBackSubmissionService;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Service
@Slf4j
public class FeedBackSubmissionServiceImpl implements IFeedBackSubmissionService {

    IFeedbackSubmissionRepository feedbackSubmissionRepository;
    ISubmissionRepository submissionRepository;
    ClassManagementServiceClient classManagementServiceClient;
    AuthServiceClient authServiceClient;

    @Override
    @Transactional
    public Long addFeedbackSubmission(FeedbackSubmissionRequest feedbackSubmissionRequest) {
        UserUtils.UserInfo currentUser = UserUtils.getCurrentUser();
        Long userId = currentUser.userId();
        Submission submission = submissionRepository.findById(feedbackSubmissionRequest.getSubmissionId())
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        SubmissionFeedback submissionFeedback = new SubmissionFeedback();
        BeanUtils.copyProperties(feedbackSubmissionRequest, submissionFeedback);
        submissionFeedback.setUserId(userId);
        submissionFeedback.setSubmission(submission);
        submissionFeedback =feedbackSubmissionRepository.save(submissionFeedback);
        submissionFeedback.setSubmission(submission);
        return submissionFeedback.getId();
    }

    @Override
    public String updateFeedbackSubmission(Long id, FeedbackSubmissionRequest feedbackSubmissionRequest) {
        SubmissionFeedback submissionFeedback = feedbackSubmissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("FeedbackSubmission not found"));
        BeanUtils.copyProperties(feedbackSubmissionRequest, submissionFeedback, "id", "createdDate");
        feedbackSubmissionRepository.save(submissionFeedback);
        return "FeedbackSubmission updated successfully";
    }

    @Override
    public List<SubmissionFeedbackResponse> getFeedbackSubmission(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));


        List<SubmissionFeedback> submissionFeedback =submission.getSubmissionFeedbacks();
        List<Long> userIds = submissionFeedback.stream()
                .map(SubmissionFeedback::getUserId)
                .distinct()
                .toList();

        Map<Long, UserResponse> userMap;
        try{
            userMap = authServiceClient.getExerciseMap(new ArrayList<>(userIds)).getResult();
        }catch (FeignClientException e){
            throw new FeignClientException("Failed to fetch user map from Auth Service");
        }

        return submissionFeedback.stream().map(ft -> {
            SubmissionFeedbackResponse response = new SubmissionFeedbackResponse();
            response.setId(ft.getId());
            response.setTeacherId(ft.getUserId());
            response.setContent(ft.getContent());
            response.setCreatedDate(ft.getCreatedDate());
            response.setFullName(userMap.get(ft.getUserId()).getFullName());
            return response;
        }).toList();
    }


}
