package com.defty.class_management_service.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassRequest {
    private Long teacherId;
    private Long courseId;
    private String className;
    private String description;
}