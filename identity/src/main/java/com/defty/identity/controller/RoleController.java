package com.defty.identity.controller;

import com.defty.identity.dto.request.RoleRequest;
import com.defty.identity.dto.response.ApiResponse;
import com.defty.identity.dto.response.RoleResponse;
import com.defty.identity.service.RoleService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoleController {
    RoleService roleService;

//    @PreAuthorize("hasAuthority('GET_ROLES')")
    @GetMapping
    ApiResponse<List<RoleResponse>> getAllRoles() {
        List<RoleResponse> roleResponses = roleService.findAllRoles();
        return ApiResponse.<List<RoleResponse>>builder()
                .result(roleResponses)
                .build();
    }

//    @PreAuthorize("hasAuthority('CREATE_ROLE')")
    @PostMapping
    ApiResponse<RoleResponse> createRole(@RequestBody RoleRequest roleRequest) {
        RoleResponse createRole = roleService.createRole(roleRequest);
        return ApiResponse.<RoleResponse>builder()
                .result(createRole)
                .build();
    }
}
