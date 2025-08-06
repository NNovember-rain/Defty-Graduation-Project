package com.defty.identity.service.impl;

import com.defty.identity.dto.request.PermissionRequest;
import com.defty.identity.dto.response.PermissionResponse;
import com.defty.identity.entity.Permission;
import com.defty.identity.mapper.PermissionMapper;
import com.defty.identity.repository.PermissionRepository;
import com.defty.identity.service.PermissionService;
import com.defty.identity.specification.PermissionSpecification;
import com.example.common_library.exceptions.AlreadyExitException;
import com.example.common_library.exceptions.NotFoundException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

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
    public PermissionResponse updatePermission(Long id, PermissionRequest request) {
        Permission permission = permissionRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Permission not found"));

        if (permissionRepository.existsByNameAndIdNotAndDeletedFalse(request.getName(), id)) {
            throw new AlreadyExitException("Permission name already exists");
        }

        permission.setName(request.getName());
        permission.setDescription(request.getDescription());
        return permissionMapper.toPermissionResponse(permissionRepository.save(permission));
    }

    @Override
    public Page<PermissionResponse> getPermissions(String name, Pageable pageable) {
        Specification<Permission> spec = Specification.where(PermissionSpecification.notDeleted());

        if (name != null && !name.trim().isEmpty()) {
            spec = spec.and(PermissionSpecification.nameContains(name.trim()));
        }

        Page<Permission> permissionsPage = permissionRepository.findAll(spec, pageable);
        return permissionsPage.map(permissionMapper::toPermissionResponse);
    }

    @Override
    public PermissionResponse getPermissionById(Long id) {
        Permission permission = permissionRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Permission not found"));
        return permissionMapper.toPermissionResponse(permission);
    }

    @Override
    public void deletePermission(Long id) {
        Permission permission = permissionRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Permission not found"));
        permission.setDeleted(true);
        permissionRepository.save(permission);
    }
}
