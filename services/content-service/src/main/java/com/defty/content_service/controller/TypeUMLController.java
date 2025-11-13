package com.defty.content_service.controller;

import com.defty.content_service.enums.TypeUml;
import com.defty.content_service.dto.response.ApiResponse;
import com.defty.content_service.dto.response.TypeUMLResponse;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/type-uml")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TypeUMLController {

    @GetMapping
    public ApiResponse<List<TypeUMLResponse>> getAll() {
        List<TypeUMLResponse> result = Arrays.stream(TypeUml.values())
                .map(t -> TypeUMLResponse.builder()
                        .name(t.name())
                        .build())
                .collect(Collectors.toList());

        return ApiResponse.<List<TypeUMLResponse>>builder()
                .result(result)
                .build();
    }

    @GetMapping("/{name}")
    public ApiResponse<TypeUMLResponse> getByName(@PathVariable String name) {
        TypeUml typeUml;
        try {
            typeUml = TypeUml.valueOf(name.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ApiResponse.<TypeUMLResponse>builder()
                    .message("TypeUml not found: " + name)
                    .build();
        }

        TypeUMLResponse response = TypeUMLResponse.builder()
                .name(typeUml.name())
                .build();

        return ApiResponse.<TypeUMLResponse>builder()
                .result(response)
                .build();
    }
}
