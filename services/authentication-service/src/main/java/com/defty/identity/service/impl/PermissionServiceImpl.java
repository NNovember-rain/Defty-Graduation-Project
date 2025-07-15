package com.defty.identity.service.impl;

import com.defty.identity.dto.request.PermissionRequest;
import com.defty.identity.dto.response.PermissionResponse;
import com.defty.identity.entity.Permission;
import com.defty.identity.mapper.PermissionMapper;
import com.defty.identity.repository.PermissionRepository;
import com.defty.identity.service.PermissionService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PermissionServiceImpl implements PermissionService {
    PermissionRepository permissionRepository;
    PermissionMapper permissionMapper;

    @Override
    public PermissionResponse createPermission(PermissionRequest permissionRequest) {
        Permission permission = permissionMapper.toPermission(permissionRequest);
        permissionRepository.save(permission);
        return permissionMapper.toPermissionResponse(permission);
    }

    @Override
    public List<PermissionResponse> getPermissions() {
        List<Permission> permissions = permissionRepository.findAll();
        return permissions.stream()
                .map(permissionMapper::toPermissionResponse)
                .toList();
    }
}
