package com.defty.content_service.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MaterialUploadRequest {
    String title;
    String description;
    String type;      // "image", "document", "video",...
//    Long classId;
    MultipartFile file;
}
