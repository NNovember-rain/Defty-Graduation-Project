package com.defty.class_management_service.mapper;

import com.defty.class_management_service.dto.request.CourseRequest;
import com.defty.class_management_service.dto.response.CourseResponse;
import com.defty.class_management_service.entity.CourseEntity;
import com.defty.class_management_service.repository.ICourseCollectionMappingRepository;
import com.defty.class_management_service.repository.ICourseRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class CourseMapper {
    private final ModelMapper modelMapper;
    @Autowired
    private final ICourseRepository courseRepository;
    @Autowired
    private final ICourseCollectionMappingRepository iCourseCollectionMappingRepository;
    public CourseEntity toCourseEntity(CourseRequest courseRequest){
        CourseEntity courseEntity = modelMapper.map(courseRequest, CourseEntity.class);
        return courseEntity;
    }
    public CourseResponse toCourseResponse(CourseEntity courseEntity) {
        CourseResponse courseResponse = modelMapper.map(courseEntity, CourseResponse.class);

        List<UUID> collectionIds = courseEntity.getCollectionMappings().stream()
                .map(CourseCollectionMappingEntity::getTestCollectionUuid)
                .collect(Collectors.toList());

        courseResponse.setCollectionIds(collectionIds);

        return courseResponse;
    }
}
