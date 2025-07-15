package com.defty.identity.service.impl;

import com.defty.identity.dto.request.RoleRequest;
import com.defty.identity.dto.response.RoleResponse;
import com.defty.identity.entity.Role;
import com.defty.identity.mapper.RoleMapper;
import com.defty.identity.repository.PermissionRepository;
import com.defty.identity.repository.RoleRepository;
import com.defty.identity.service.RoleService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoleServiceImpl implements RoleService {
    RoleRepository roleRepository;
    PermissionRepository permissionRepository;
    RoleMapper roleMapper;

    @Override
    public RoleResponse createRole(RoleRequest roleRequest) {
        Role role = roleMapper.toRole(roleRequest);
        var permissions = permissionRepository.findAllById(roleRequest.getPermissions());
        role.setPermissions(new HashSet<>(permissions));
        roleRepository.save(role);
        return roleMapper.toRoleResponse(role);
    }

    @Override
    public Page<RoleResponse> findAllRoles(String name, Pageable pageable) {
        Page<Role> rolesPage;

        if (name == null || name.trim().isEmpty()) {
            rolesPage = roleRepository.findAll(pageable);
        } else {
            rolesPage = roleRepository.findByNameContainingIgnoreCase(name.trim(), pageable);
        }

        return rolesPage.map(roleMapper::toRoleResponse);
    }

}
