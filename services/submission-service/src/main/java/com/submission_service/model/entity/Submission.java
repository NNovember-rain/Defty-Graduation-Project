package com.submission_service.model.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Submission extends BaseEntity {

    Integer studentId;
    Integer assignmentId;
    String studentPlantUMLCode;
//    String submissionFile;
    Integer status;

}
