package com.submission_service.model.dto.response;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ClassResponse {
    Long id;
    String name;
    String description;
    String subject;
    String room;
    String inviteCode;
    Integer status;
}
