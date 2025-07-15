package com.defty.identity.service;

import com.defty.identity.dto.request.PermissionRequest;
import com.defty.identity.dto.response.PermissionResponse;

import java.util.List;

public interface PermissionService {
    PermissionResponse createPermission(PermissionRequest permissionRequest);
    List<PermissionResponse> getPermissions();
}
