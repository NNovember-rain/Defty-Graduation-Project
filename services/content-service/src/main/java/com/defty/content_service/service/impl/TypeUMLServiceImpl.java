package com.defty.content_service.service.impl;

import com.defty.content_service.dto.request.TypeUMLRequest;
import com.defty.content_service.dto.response.TypeUMLResponse;
import com.defty.content_service.entity.TypeUML;
import com.defty.content_service.exception.AppException;
import com.defty.content_service.exception.ErrorCode;
import com.defty.content_service.repository.TypeUMLRepository;
import com.defty.content_service.service.TypeUMLService;
import com.defty.content_service.specification.TypeUMLSpecification;
import com.example.common_library.exceptions.NotFoundException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TypeUMLServiceImpl implements TypeUMLService {
    TypeUMLRepository typeUMLRepository;

    @Override
    public TypeUMLResponse create(TypeUMLRequest request) {
        if (typeUMLRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.TYPE_UML_EXISTED);
        }

        TypeUML typeUML = TypeUML.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();
        typeUMLRepository.save(typeUML);

        return TypeUMLResponse.builder()
                .id(typeUML.getId())
                .name(typeUML.getName())
                .description(typeUML.getDescription())
                .isActive(typeUML.getIsActive())
                .createdDate(typeUML.getCreatedDate())
                .build();
    }

    @Override
    public TypeUMLResponse update(Long id, TypeUMLRequest request) {
        TypeUML typeUML = typeUMLRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("TypeUML not found"));

        if (typeUMLRepository.existsByNameAndIdNot(request.getName(), id)) {
            throw new AppException(ErrorCode.TYPE_UML_EXISTED);
        }

        typeUML.setName(request.getName());
        typeUML.setDescription(request.getDescription());
        typeUMLRepository.save(typeUML);

        return TypeUMLResponse.builder()
                .id(typeUML.getId())
                .name(typeUML.getName())
                .description(typeUML.getDescription())
                .isActive(typeUML.getIsActive())
                .createdDate(typeUML.getCreatedDate())
                .build();
    }

    @Override
    public void delete(Long id) {
        TypeUML typeUML = typeUMLRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("TypeUML not found"));
        typeUML.setIsActive(-1);
        typeUMLRepository.save(typeUML);
    }

    @Override
    public TypeUMLResponse getById(Long id) {
        TypeUML typeUML = typeUMLRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("TypeUML not found"));

        return TypeUMLResponse.builder()
                .id(typeUML.getId())
                .name(typeUML.getName())
                .description(typeUML.getDescription())
                .isActive(typeUML.getIsActive())
                .createdDate(typeUML.getCreatedDate())
                .build();
    }

    @Override
    public Page<TypeUMLResponse> getAll(String name, Pageable pageable) {
        Specification<TypeUML> spec = Specification.where(TypeUMLSpecification.hasNameLike(name))
                .and(TypeUMLSpecification.isActiveOnly());

        return typeUMLRepository.findAll(spec, pageable)
                .map(type -> TypeUMLResponse.builder()
                        .id(type.getId())
                        .name(type.getName())
                        .description(type.getDescription())
                        .isActive(type.getIsActive())
                        .createdDate(type.getCreatedDate())
                        .build());
    }

    @Override
    public TypeUMLResponse toggleActive(Long id) {
        TypeUML typeUML = typeUMLRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("TypeUML not found"));
        Integer currentStatus = typeUML.getIsActive();
        typeUML.setIsActive(currentStatus != null && currentStatus == 1 ? 0 : 1);
        TypeUML updateTypeUml = typeUMLRepository.save(typeUML);
        return TypeUMLResponse.builder()
                .id(updateTypeUml.getId())
                .name(updateTypeUml.getName())
                .description(updateTypeUml.getDescription())
                .isActive(updateTypeUml.getIsActive())
                .createdDate(updateTypeUml.getCreatedDate())
                .build();
    }
}

