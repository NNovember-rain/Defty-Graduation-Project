package com.submission_service.service.impl;

import com.example.common_library.utils.UserUtils;
import com.submission_service.client.AuthServiceClient;
import com.submission_service.client.ClassManagementServiceClient;
import com.submission_service.model.dto.request.FeedbackTeacherRequest;
import com.submission_service.model.dto.response.ClassResponse;
import com.submission_service.model.dto.response.FeedbackTeacherResponse;
import com.submission_service.model.dto.response.UserResponse;
import com.submission_service.model.entity.FeedbackTeacher;
import com.submission_service.model.entity.Submission;
import com.submission_service.repository.IFeedbackTeacherRepository;
import com.submission_service.repository.ISubmissionRepository;
import com.submission_service.service.IFeedBackTeacherService;
import feign.FeignException;
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
public class FeedBackTeacherServiceImpl implements IFeedBackTeacherService {

    IFeedbackTeacherRepository feedbackTeacherRepository;
    ISubmissionRepository submissionRepository;
    ClassManagementServiceClient classManagementServiceClient;
    AuthServiceClient authServiceClient;

    @Override
    @Transactional
    public Long addFeedbackTeacher(FeedbackTeacherRequest feedbackTeacherRequest) {

        UserUtils.UserInfo currentUser = UserUtils.getCurrentUser();
        Submission submission = submissionRepository.findById(feedbackTeacherRequest.getSubmissionId())
                .orElseThrow(() -> new RuntimeException("Submission not found"));

//        try{
//            ClassResponse classResponse = classManagementServiceClient.getClassById(submission.getClassId()).getResult();
//            if(classResponse.ge){
//                throw new RuntimeException("You are not authorized to give feedback for this submission");
//            }
//        } catch (Exception e){
//            throw new RuntimeException(e.getMessage());
//        }

        FeedbackTeacher feedbackTeacher = new FeedbackTeacher();
        BeanUtils.copyProperties(feedbackTeacherRequest, feedbackTeacher);
        feedbackTeacher.setTeacherId(currentUser.userId());
        feedbackTeacher.setSubmission(submission);
        feedbackTeacher=feedbackTeacherRepository.save(feedbackTeacher);
        feedbackTeacher.setSubmission(submission);
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

        UserResponse userResponse= authServiceClient.getUser(UserUtils.getCurrentUser().userId()).getResult();

        List<FeedbackTeacher> feedbackTeacher=submission.getFeedbackTeachers();
        return feedbackTeacher.stream().map(ft -> {
            FeedbackTeacherResponse response = new FeedbackTeacherResponse();
            response.setId(ft.getId());
            response.setTeacherId(ft.getTeacherId());
            response.setContent(ft.getContent());
            response.setCreatedDate(ft.getCreatedDate());
            response.setFullName(userResponse.getFullName());
            return response;
        }).toList();
    }


}
