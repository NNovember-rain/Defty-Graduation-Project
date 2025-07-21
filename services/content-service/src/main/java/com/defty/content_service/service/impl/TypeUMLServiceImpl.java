package com.defty.content_service.service.impl;

import com.defty.content_service.dto.request.TypeUMLRequest;
import com.defty.content_service.dto.response.TypeUMLResponse;
import com.defty.content_service.entity.TypeUML;
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
            throw new IllegalArgumentException("TypeUML already exists");
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
                .build();
    }

    @Override
    public TypeUMLResponse update(Long id, TypeUMLRequest request) {
        TypeUML typeUML = typeUMLRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("TypeUML not found"));

        if (typeUMLRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("TypeUML already exists");
        }

        typeUML.setName(request.getName());
        typeUMLRepository.save(typeUML);

        return TypeUMLResponse.builder()
                .id(typeUML.getId())
                .name(typeUML.getName())
                .description(typeUML.getDescription())
                .build();
    }

    @Override
    public void delete(Long id) {
        if (!typeUMLRepository.existsById(id)) {
            throw new NotFoundException("TypeUML not found");
        }
        typeUMLRepository.deleteById(id);
    }

    @Override
    public TypeUMLResponse getById(Long id) {
        TypeUML typeUML = typeUMLRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("TypeUML not found"));

        return TypeUMLResponse.builder()
                .id(typeUML.getId())
                .name(typeUML.getName())
                .description(typeUML.getDescription())
                .build();
    }

    @Override
    public Page<TypeUMLResponse> getAll(String name, Pageable pageable) {
        Specification<TypeUML> spec = Specification.where(TypeUMLSpecification.hasNameLike(name));

        return typeUMLRepository.findAll(spec, pageable)
                .map(type -> TypeUMLResponse.builder()
                        .id(type.getId())
                        .name(type.getName())
                        .description(type.getDescription())
                        .build());
    }
}

