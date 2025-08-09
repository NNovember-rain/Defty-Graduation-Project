package com.defty.class_management_service.mapper;

import com.defty.class_management_service.dto.request.ClassRequest;
import com.defty.class_management_service.dto.response.ClassResponse;
import com.defty.class_management_service.entity.ClassEntity;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ClassMapper {
    private final ModelMapper modelMapper;
    public ClassEntity toClassEntity(ClassRequest classRequest){
        ClassEntity classEntity = modelMapper.map(classRequest, ClassEntity.class);
        classEntity.setId(null);
        return classEntity;
    }
    public ClassResponse toClassResponse(ClassEntity classEntity){
        return modelMapper.map(classEntity, ClassResponse.class);
    }
}
