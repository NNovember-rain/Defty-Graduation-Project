package com.submission_service.service.impl;

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

import java.util.List;

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
        Submission submission = submissionRepository.findById(feedbackSubmissionRequest.getSubmissionId())
                .orElseThrow(() -> new RuntimeException("Submission not found"));

//        try{
//            ClassResponse classResponse = classManagementServiceClient.getClassById(submission.getClassId()).getResult();
//            if(classResponse.ge){
//                throw new RuntimeException("You are not authorized to give feedback for this submission");
//            }
//        } catch (Exception e){
//            throw new RuntimeException(e.getMessage());
//        }

        SubmissionFeedback submissionFeedback = new SubmissionFeedback();
        BeanUtils.copyProperties(feedbackSubmissionRequest, submissionFeedback);
        submissionFeedback.setUserId(currentUser.userId());
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

        UserResponse userResponse= authServiceClient.getUser(UserUtils.getCurrentUser().userId()).getResult();

        List<SubmissionFeedback> submissionFeedback =submission.getSubmissionFeedbacks();
        return submissionFeedback.stream().map(ft -> {
            SubmissionFeedbackResponse response = new SubmissionFeedbackResponse();
            response.setId(ft.getId());
            response.setTeacherId(ft.getUserId());
            response.setContent(ft.getContent());
            response.setCreatedDate(ft.getCreatedDate());
            response.setFullName(userResponse.getFullName());
            return response;
        }).toList();
    }


}
