package com.defty.content_service.controller;

import com.defty.content_service.dto.request.TypeUMLRequest;
import com.defty.content_service.dto.response.ApiResponse;
import com.defty.content_service.dto.response.TypeUMLResponse;
import com.defty.content_service.service.TypeUMLService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/type-uml")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TypeUMLController {
    TypeUMLService typeUMLService;

    @PostMapping
    ApiResponse<TypeUMLResponse> create(@RequestBody TypeUMLRequest request) {
        return ApiResponse.<TypeUMLResponse>builder()
                .result(typeUMLService.create(request))
                .build();
    }

    @PutMapping("/{id}")
    ApiResponse<TypeUMLResponse> update(@PathVariable Long id, @RequestBody TypeUMLRequest request) {
        return ApiResponse.<TypeUMLResponse>builder()
                .result(typeUMLService.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    ApiResponse<String> delete(@PathVariable Long id) {
        typeUMLService.delete(id);
        return ApiResponse.<String>builder()
                .result("Deleted successfully")
                .build();
    }

    @GetMapping("/{id}")
    ApiResponse<TypeUMLResponse> getById(@PathVariable Long id) {
        return ApiResponse.<TypeUMLResponse>builder()
                .result(typeUMLService.getById(id))
                .build();
    }

    @GetMapping
    ApiResponse<Page<TypeUMLResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(value = "name", required = false) String name
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<TypeUMLResponse> result = typeUMLService.getAll(name, pageable);
        return ApiResponse.<Page<TypeUMLResponse>>builder()
                .result(result)
                .build();
    }

}

