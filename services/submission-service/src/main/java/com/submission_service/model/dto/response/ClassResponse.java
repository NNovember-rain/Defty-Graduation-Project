package com.submission_service.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassResponse extends BaseResponse{
    private Long id;
    private Long teacherId;
    private String inviteCode;
    private String className;
    private String classType;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String scheduleJson;
    private Integer currentStudents;
    private Long courseId;
    private String courseColor;
}