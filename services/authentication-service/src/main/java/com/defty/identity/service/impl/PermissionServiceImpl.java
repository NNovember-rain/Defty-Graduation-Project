package com.defty.identity.service.impl;

import com.defty.identity.dto.request.PermissionRequest;
import com.defty.identity.dto.response.PermissionResponse;
import com.defty.identity.entity.Permission;
import com.defty.identity.exception.AppException;
import com.defty.identity.exception.ErrorCode;
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
        if (permissionRepository.existsPermissionByName(permission.getName())) {
            throw new AppException(ErrorCode.PERMISSION_EXISTED);
        }
        permission.setIsActive(1);
        permissionRepository.save(permission);
        return permissionMapper.toPermissionResponse(permission);
    }

    @Override
    public PermissionResponse updatePermission(Long id, PermissionRequest request) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Permission not found"));

        if (permissionRepository.existsByNameAndIdNot(request.getName(), id)) {
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
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Permission not found"));
        return permissionMapper.toPermissionResponse(permission);
    }

    @Override
    public void deletePermission(Long id) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Permission not found"));
        permission.setIsActive(-1);
        permissionRepository.save(permission);
    }

    @Override
    public Page<PermissionResponse> getPermissionsByRoleId(Long roleId, String name, Pageable pageable) {
        Page<Permission> permissionsPage = permissionRepository
                .findAllActiveByRoleIdAndNameContaining(roleId, name, pageable);
        return permissionsPage.map(permissionMapper::toPermissionResponse);
    }

    @Override
    public PermissionResponse togglePermissionStatus(Long id) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Permission not found with ID: " + id));

        Integer currentStatus = permission.getIsActive();
        permission.setIsActive(currentStatus != null && currentStatus == 1 ? 0 : 1);

        Permission updatedPermission = permissionRepository.save(permission);
        return permissionMapper.toPermissionResponse(updatedPermission);
    }

}
