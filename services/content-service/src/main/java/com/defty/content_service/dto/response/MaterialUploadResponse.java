package com.defty.content_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MaterialUploadResponse {
    String title;
    String description;
    String type;      // "image", "document", "video",...
    Long classId;
    Long userId;
    String url;
    String format;
    String readableSize;
}
