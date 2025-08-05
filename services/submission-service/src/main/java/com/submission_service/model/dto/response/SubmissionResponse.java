package com.submission_service.model.dto.response;

import com.submission_service.enums.SubmissionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SubmissionResponse {
    Long id;
    String studentName="Hoàng Hiệp";
    String studentCode="B21DCCN341";
    String classCode="B555";
    String assignmentTitle="Quản lý thư viện";
    String umlType="Use Case";
    Date createdDate;
    SubmissionStatus submissionStatus;
}