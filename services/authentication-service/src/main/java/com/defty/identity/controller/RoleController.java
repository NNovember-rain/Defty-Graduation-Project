package com.defty.identity.controller;

import com.defty.identity.dto.request.RoleRequest;
import com.defty.identity.dto.response.ApiResponse;
import com.defty.identity.dto.response.RoleResponse;
import com.defty.identity.service.RoleService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoleController {
    RoleService roleService;

    @PreAuthorize("hasRole('admin')")
    @GetMapping
    ApiResponse<Page<RoleResponse>> getAllRoles(@RequestParam(value = "page", defaultValue = "0") int page,
                                                @RequestParam(value = "size", defaultValue = "10") int size,
                                                @RequestParam(value = "name", required = false) String name) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdDate").descending());
        Page<RoleResponse> roleResponses = roleService.findAllRoles(name, pageable);
        return ApiResponse.<Page<RoleResponse>>builder()
                .result(roleResponses)
                .build();
    }

    @PreAuthorize("hasRole('admin')")
    @GetMapping("/isActive")
    ApiResponse<Page<RoleResponse>> getAllRolesActive(@RequestParam(value = "page", defaultValue = "0") int page,
                                                @RequestParam(value = "size", defaultValue = "10") int size,
                                                @RequestParam(value = "name", required = false) String name) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdDate").descending());
        Page<RoleResponse> roleResponses = roleService.findAllRolesActive(name, pageable);
        return ApiResponse.<Page<RoleResponse>>builder()
                .result(roleResponses)
                .build();
    }

    @PreAuthorize("hasRole('admin')")
    @GetMapping("/{id}")
    public ApiResponse<RoleResponse> getRoleById(@PathVariable Long id) {
        RoleResponse roleResponse = roleService.getRoleById(id);
        return ApiResponse.<RoleResponse>builder()
                .result(roleResponse)
                .build();
    }

    @PreAuthorize("hasRole('admin')")
    @PostMapping
    ApiResponse<RoleResponse> createRole(@RequestBody RoleRequest roleRequest) {
        RoleResponse createRole = roleService.createRole(roleRequest);
        return ApiResponse.<RoleResponse>builder()
                .result(createRole)
                .build();
    }

    @PreAuthorize("hasRole('admin')")
    @PatchMapping("/{id}")
    public ApiResponse<RoleResponse> updateRole(@PathVariable Long id,
                                                @RequestBody RoleRequest roleRequest) {
        RoleResponse updatedRole = roleService.updateRole(id, roleRequest);
        return ApiResponse.<RoleResponse>builder()
                .result(updatedRole)
                .build();
    }

    @PreAuthorize("hasRole('admin')")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteRole(@PathVariable Long id) {
        roleService.deleteRole(id);
        return ApiResponse.<Void>builder()
                .message("Role deleted successfully")
                .build();
    }

    @PreAuthorize("hasRole('admin')")
    @PatchMapping("/{id}/toggle-active")
    public ApiResponse<RoleResponse> toggleActiveStatus(@PathVariable Long id) {
        RoleResponse updatedRole = roleService.toggleRoleStatus(id);
        return ApiResponse.<RoleResponse>builder()
                .result(updatedRole)
                .message("Role status updated successfully")
                .build();
    }
}
