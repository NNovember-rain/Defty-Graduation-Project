package com.defty.identity.controller;


import com.defty.identity.dto.request.PermissionRequest;
import com.defty.identity.dto.response.ApiResponse;
import com.defty.identity.dto.response.PermissionResponse;
import com.defty.identity.service.PermissionService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/permissions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PermissionController {
    PermissionService permissionService;

//    @PreAuthorize("hasAuthority('CREATE_PERMISSION')")
    @GetMapping
    ApiResponse<List<PermissionResponse>> getAllPermissions() {
        List<PermissionResponse> permissions = permissionService.getPermissions();
        return ApiResponse.<List<PermissionResponse>>builder()
                .result(permissions)
                .build();
    }

//    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    ApiResponse<PermissionResponse> createPermission(@RequestBody PermissionRequest permissionRequest) {
        PermissionResponse createdPermission = permissionService.createPermission(permissionRequest);
        return ApiResponse.<PermissionResponse>builder()
                .result(createdPermission)
                .build();
    }
}
