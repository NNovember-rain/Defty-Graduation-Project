package com.defty.class_management_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;


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