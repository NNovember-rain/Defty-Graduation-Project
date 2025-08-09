package com.defty.identity.service;

import com.defty.identity.dto.request.PermissionRequest;
import com.defty.identity.dto.response.PermissionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PermissionService {
    PermissionResponse createPermission(PermissionRequest permissionRequest);
    PermissionResponse updatePermission(Long id, PermissionRequest permissionRequest);
    Page<PermissionResponse> getPermissions(String name, Pageable pageable);
    PermissionResponse getPermissionById(Long id);
    void deletePermission(Long id);
    Page<PermissionResponse> getPermissionsByRoleId(Long roleId, String name, Pageable pageable);
    PermissionResponse togglePermissionStatus(Long id);
}