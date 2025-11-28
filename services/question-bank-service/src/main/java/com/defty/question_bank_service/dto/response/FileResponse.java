package com.defty.question_bank_service.dto.response;

import com.defty.question_bank_service.enums.FileType;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class FileResponse extends BaseResponse {
    @EqualsAndHashCode.Include
    private UUID id;
    private FileType type;
    private String url;
    private UUID questionGroupId;
    private Integer displayOrder;
}