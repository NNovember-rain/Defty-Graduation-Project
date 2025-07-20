package com.submission_service.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class Submission extends BaseEntity {

    private Integer studentId;
    private Integer assignmentId;
    private String studentPlantUMLCode;
    private String solutionPlantUMLCode;
//    private String submissionFile;
    private Integer status;
}
