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
public class ModuleResponse {
    Long id;
    String moduleName;
    String moduleDescription;
    List<SolutionResponse> solutionResponses;
}
