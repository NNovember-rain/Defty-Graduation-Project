package com.submission_service.mapper;

import com.submission_service.model.dto.request.SubmissionRequest;
import com.submission_service.model.dto.response.*;
import com.submission_service.model.entity.Submission;
import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SubmissionMapper {

//    @Mapping(target = "classCode", expression = "java(getClassCode(classResponse))")
    @Mapping(target = "studentCode", expression = "java(getStudentCode(user))")
    @Mapping(target = "studentName", expression = "java(getStudentName(user))")
    @Mapping(target = "assignmentTitle", expression = "java(getAssignmentTitle(assignment))")
    SubmissionResponse toSubmissionResponse(
            Submission submission,
            @Context UserResponse user,
            @Context AssignmentResponse assignment,
            @Context ClassResponse classResponse
    );

    @Mapping(target = "studentName", expression = "java(getStudentName(user))")
    SubmissionDetailResponse toSubmissionDetailResponse(
            Submission submission,
            @Context UserResponse user,
            @Context ClassResponse classResponse
    );

    @Mapping(target = "studentId", source = "userId")
    Submission submissionRequestToSubmission(
            SubmissionRequest submissionRequest,
            Long userId
    );


    default String getStudentCode(UserResponse user) {
        return user != null ? user.getUserCode() : null;
    }

    default String getStudentName(UserResponse user) {
        return user != null ? user.getFullName() : null;
    }

    default String getClassCode(ClassResponse classResponse) {
        return classResponse != null ? classResponse.getInviteCode() : null;
    }

    default String getAssignmentTitle(AssignmentResponse assignment) {
        return assignment != null ? assignment.getTitle() : null;
    }


}