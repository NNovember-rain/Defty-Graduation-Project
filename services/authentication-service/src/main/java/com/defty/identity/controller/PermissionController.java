package com.defty.identity.controller;

import com.defty.identity.dto.request.PermissionRequest;
import com.defty.identity.dto.response.ApiResponse;
import com.defty.identity.dto.response.PermissionResponse;
import com.defty.identity.service.PermissionService;
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
@RequestMapping("/permissions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PermissionController {
    PermissionService permissionService;

    @PreAuthorize("hasRole('admin')")
    @GetMapping
    public ApiResponse<Page<PermissionResponse>> getPermissions(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "name", required = false) String name
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdDate").ascending());
        Page<PermissionResponse> permissions = permissionService.getPermissions(name, pageable);
        return ApiResponse.<Page<PermissionResponse>>builder()
                .result(permissions)
                .build();
    }

    @PreAuthorize("hasRole('admin')")
    @GetMapping("/{id}")
    public ApiResponse<PermissionResponse> getPermissionById(@PathVariable Long id) {
        PermissionResponse response = permissionService.getPermissionById(id);
        return ApiResponse.<PermissionResponse>builder().result(response).build();
    }

    @PreAuthorize("hasRole('admin')")
    @PostMapping
    ApiResponse<PermissionResponse> createPermission(@RequestBody PermissionRequest permissionRequest) {
        PermissionResponse createdPermission = permissionService.createPermission(permissionRequest);
        return ApiResponse.<PermissionResponse>builder()
                .result(createdPermission)
                .build();
    }

    @PreAuthorize("hasRole('admin')")
    @PutMapping("/{id}")
    public ApiResponse<PermissionResponse> updatePermission(@PathVariable Long id,
                                                            @RequestBody PermissionRequest request) {
        PermissionResponse response = permissionService.updatePermission(id, request);
        return ApiResponse.<PermissionResponse>builder()
                .result(response)
                .build();
    }

    @PreAuthorize("hasRole('admin')")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deletePermission(@PathVariable Long id) {
        permissionService.deletePermission(id);
        return ApiResponse.<Void>builder().build();
    }

    @PreAuthorize("hasRole('admin')")
    @GetMapping("/by-role/{roleId}")
    public ApiResponse<Page<PermissionResponse>> getPermissionsByRole(@PathVariable Long roleId,
                                                                  @RequestParam(required = false) String name,
                                                                  @RequestParam(value = "page", defaultValue = "0") int page,
                                                                  @RequestParam(value = "size", defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdDate").ascending());
        Page<PermissionResponse> permissions = permissionService.getPermissionsByRoleId(roleId, name, pageable);
        return ApiResponse.<Page<PermissionResponse>>builder()
                .result(permissions)
                .build();
    }

    @PreAuthorize("hasRole('admin')")
    @PatchMapping("/{id}/toggle-active")
    public ApiResponse<PermissionResponse> toggleActiveStatus(@PathVariable Long id) {
        PermissionResponse updatedPermission = permissionService.togglePermissionStatus(id);
        return ApiResponse.<PermissionResponse>builder()
                .result(updatedPermission)
                .message("Permission status updated successfully")
                .build();
    }

}
