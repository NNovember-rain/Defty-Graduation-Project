package com.defty.question_bank_service.mapper;

//import com.defty.common_library.utils.FileUrlUtil;
import com.defty.question_bank_service.dto.response.FileResponse;
import com.defty.question_bank_service.entity.FileEntity;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FileMapper {

    private final ModelMapper modelMapper;
//    private final FileUrlUtil fileUrlUtil;

    public FileResponse toResponse(FileEntity entity) {
        FileResponse response = modelMapper.map(entity, FileResponse.class);
//        response.setUrl(fileUrlUtil.resolveFullUrl(entity.getUrl()));
        response.setQuestionGroupId(entity.getQuestionGroup().getId());
        return response;
    }

    public void updateEntity(FileEntity source, FileEntity target) {
        target.setType(source.getType());
        target.setUrl(source.getUrl());
        target.setDisplayOrder(source.getDisplayOrder());
        target.setQuestionGroup(source.getQuestionGroup());
    }
}