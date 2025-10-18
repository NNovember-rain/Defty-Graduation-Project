package com.submission_service.mapper;

import com.submission_service.model.dto.request.SubmissionRequest;
import com.submission_service.model.dto.response.*;
import com.submission_service.model.entity.Submission;
import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SubmissionMapper {

    @Mapping(target = "isfeedbackTeacher", expression = "java(hasFeedbackTeacher(submission))")
    SubmissionResponse toSubmissionResponse(Submission submission);

    @Mapping(target = "studentId", source = "userResponse.id")
    @Mapping(target = "studentName", source = "userResponse.fullName")
    @Mapping(target = "studentCode", source = "userResponse.userCode")
    @Mapping(target = "assignmentId", source = "assignmentResponse.id")
    @Mapping(target = "assignmentTitle", source = "assignmentResponse.title")
    @Mapping(target = "classId", source = "classResponse.id")
    @Mapping(target = "classCode", source = "classResponse.inviteCode")
    @Mapping(target = "studentPlantUMLCode", source = "submissionRequest.studentPlantUmlCode")
    Submission submissionRequestToSubmission(
            SubmissionRequest submissionRequest,
            UserResponse userResponse,
            AssignmentResponse assignmentResponse,
            ClassResponse classResponse
    );

    default boolean hasFeedbackTeacher(Submission submission) {
        return submission.getFeedbackTeachers() != null && !submission.getFeedbackTeachers().isEmpty();
    }
}