package com.defty.question_bank_service.dto.request;

import lombok.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DirectionSetMultipartRequest {
    private String directionSetName;
    private String description;
    private Boolean isDefault;

    // JSON string chứa direction text các part
    private String directionsJson; // JSON {"PART_1": {"directionText": "..."}}

    // Map các file audio, key là tên part (PART_1, PART_2,...)
    private Map<String, MultipartFile> audioFiles;
}
