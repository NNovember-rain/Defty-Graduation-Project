package com.defty.content_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TypeUMLResponse {
    Long id;
    String name;
    String description;
    Integer isActive;
    Date createdDate;
}
