package com.defty.content_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssignmentResponse {
    Long id;
    String title;
    String description;
    Long userId;
    Long typeUmlId;
    List<Long> classIds;
}
