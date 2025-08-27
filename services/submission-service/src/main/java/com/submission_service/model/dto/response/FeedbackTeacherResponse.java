package com.submission_service.model.dto.response;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.util.Date;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FeedbackTeacherResponse {
    Long id;
    Date createdDate= new Date();
    Date updatedDate=new Date();
    String feedback;
}
