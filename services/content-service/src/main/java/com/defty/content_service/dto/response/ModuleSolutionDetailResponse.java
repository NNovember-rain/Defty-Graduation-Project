package com.defty.content_service.dto.response;

import com.defty.content_service.enums.TypeUml;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ModuleSolutionDetailResponse {
    Long solutionId;
    String solutionCode;
    TypeUml typeUml;
    Long moduleId;
    String moduleName;
    String moduleDescription;
    String moduleDescriptionHtml;
    Long assignmentId;
    String assignmentName;
    String commonDescription;
    String commonDescriptionHtml;
}
