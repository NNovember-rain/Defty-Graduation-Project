package com.defty.content_service.service;

import com.defty.content_service.dto.request.TypeUMLRequest;
import com.defty.content_service.dto.response.TypeUMLResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TypeUMLService {
    TypeUMLResponse create(TypeUMLRequest request);
    TypeUMLResponse update(Long id, TypeUMLRequest request);
    void delete(Long id);
    TypeUMLResponse getById(Long id);
    Page<TypeUMLResponse> getAll(String name, Pageable pageable);
}
