package com.defty.class_management_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponse extends BaseResponse{
    private Long id;
    private String courseName;
    private String description;
    private String color;
    private List<UUID> collectionIds;
}