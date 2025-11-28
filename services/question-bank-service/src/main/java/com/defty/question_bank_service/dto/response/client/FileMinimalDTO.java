package com.defty.question_bank_service.dto.response.client;

import com.defty.question_bank_service.enums.FileType;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class FileMinimalDTO {
    @EqualsAndHashCode.Include
    private UUID id;
    private String url;
    private FileType fileType;
    private Integer displayOrder;
}