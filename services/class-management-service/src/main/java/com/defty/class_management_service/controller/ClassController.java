package com.defty.class_management_service.controller;

import com.defty.class_management_service.dto.request.ClassRequest;
import com.defty.class_management_service.dto.response.ClassResponse;
import com.defty.class_management_service.service.IClassService;
import com.example.common_library.dto.response.ApiResponse;
import com.example.common_library.dto.response.PageableResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Slf4j
@RequiredArgsConstructor
@RequestMapping("/class")
public class ClassController {
    private final IClassService classService;
    @PostMapping("")
    public ApiResponse createClass(@ModelAttribute ClassRequest classRequest) {
        return classService.createClass(classRequest);
    }
    @GetMapping("/{id}")
    public Object getClassById(@PathVariable Long id) {
        log.info("Request to get class by ID: {}", id);
        return classService.getClassById(id);
    }

    @GetMapping("/classes")
    public Object getClasses(Pageable pageable,
                             @RequestParam(name = "class_name", required = false) String className,
                             @RequestParam(name = "teacher_id", required = false) Long teacherId,
                             @RequestParam(name = "status", required = false) Integer status) {
        log.info("Request to get classes");
        return classService.getClasses(pageable, className, teacherId, status);
    }

    @GetMapping("/teacher/{teacherId}")
    public Object getClassesByTeacherId(Pageable pageable,
                                        @PathVariable Long teacherId,
                                        @RequestParam(name = "status", required = false) Integer status) {
        log.info("Request to get classes by teacher ID: {}", teacherId);
        return classService.getClassesByTeacherId(pageable, teacherId, status);
    }

    @PutMapping("/{id}")
    public ApiResponse<Long> updateClass(@PathVariable Long id, @ModelAttribute ClassRequest classRequest) {
        log.info("Request to update class with ID {}: {}", id, classRequest);
        return classService.updateClass(id, classRequest);
    }

    @DeleteMapping("/{ids}")
    public ApiResponse<List<Long>> deleteClasses(@PathVariable List<Long> ids) {
        log.info("Request to delete classes with IDS {}", ids);
        return classService.deleteClass(ids);
    }
    @PatchMapping("/{id}/toggle-status")
    ApiResponse<Long> toggleActiveStatus(@PathVariable Long id) {
        return classService.toggleActiveStatus(id);
    }
}
