package com.defty.class_management_service.mapper;

import com.defty.class_management_service.dto.request.ClassRequest;
import com.defty.class_management_service.dto.response.ClassResponse;
import com.defty.class_management_service.entity.ClassEntity;
import com.defty.class_management_service.entity.CourseEntity;
import com.defty.class_management_service.repository.IEnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ClassMapper {
    private final ModelMapper modelMapper;
    @Autowired
    private final IEnrollmentRepository enrollmentRepository;
    public ClassEntity toClassEntity(ClassRequest classRequest){
        ClassEntity classEntity = modelMapper.map(classRequest, ClassEntity.class);
        return classEntity;
    }
    public ClassResponse toClassResponse(ClassEntity classEntity) {
        ClassResponse classResponse = modelMapper.map(classEntity, ClassResponse.class);

        classResponse.setCurrentStudents(
                enrollmentRepository.findAllActiveByClassId(classEntity.getId()).size()
        );
        if (classEntity.getCourseEntity() != null) {
            CourseEntity courseEntity = classEntity.getCourseEntity();
            classResponse.setCourseId(courseEntity.getId());
            classResponse.setCourseColor(courseEntity.getColor());
        }

        return classResponse;
    }

}
