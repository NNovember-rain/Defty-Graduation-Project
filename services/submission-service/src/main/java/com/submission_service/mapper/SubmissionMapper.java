package com.submission_service.mapper;

import com.submission_service.model.dto.request.SubmissionRequest;
import com.submission_service.model.dto.response.*;
import com.submission_service.model.entity.Submission;
import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SubmissionMapper {

    @Mapping(target = "studentName", expression = "java(getStudentName(user))")
    @Mapping(target = "studentCode", expression = "java(getStudentCode(user))")
    @Mapping(target = "classCode", expression = "java(getClassCode(classResponse))")
    @Mapping(target = "assignmentTitle", expression = "java(getAssignmentTitle(assignment))")
    @Mapping(target = "descriptionAssignment", expression = "java(getAssignmentDescription(assignment))")
    @Mapping(target = "isfeedbackTeacher", expression = "java(hasFeedbackTeacher(submission))")
    SubmissionResponse toSubmissionResponse(
            Submission submission,
            @Context UserResponse user,
            @Context AssignmentResponse assignment,
            @Context ClassResponse classResponse
    );

    @Mapping(target = "studentId", source = "userResponse.id")
    @Mapping(target = "assignmentId", source = "assignmentResponse.id")
    @Mapping(target = "classId", source = "classResponse.id")
    @Mapping(target = "moduleId", source = "moduleResponse.id")
    @Mapping(target = "studentPlantUMLCode", source = "submissionRequest.studentPlantUmlCode")
    Submission submissionRequestToSubmission(
            SubmissionRequest submissionRequest,
            UserResponse userResponse,
            AssignmentResponse assignmentResponse,
            ClassResponse classResponse,
            ModuleResponse moduleResponse
    );

    default boolean hasFeedbackTeacher(Submission submission) {
        return submission.getSubmissionFeedbacks() != null && !submission.getSubmissionFeedbacks().isEmpty();
    }

    default String getStudentName(UserResponse user) {
        return user != null ? user.getFullName() : null;
    }

    default String getStudentCode(UserResponse user) {
        return user != null ? user.getUserCode() : null;
    }

    default String getClassCode(ClassResponse classResponse) {
        return classResponse != null ? classResponse.getInviteCode() : null;
    }

    default String getAssignmentTitle(AssignmentResponse assignment) {
        return assignment != null ? assignment.getTitle() : null;
    }

    default String getAssignmentDescription(AssignmentResponse assignment) {
        return assignment != null ? assignment.getCommonDescription() : null;
    }

}