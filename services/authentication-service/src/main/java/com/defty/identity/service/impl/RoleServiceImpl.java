package com.defty.identity.service.impl;

import com.defty.identity.dto.request.RoleRequest;
import com.defty.identity.dto.response.RoleResponse;
import com.defty.identity.entity.Role;
import com.defty.identity.exception.AppException;
import com.defty.identity.exception.ErrorCode;
import com.defty.identity.mapper.RoleMapper;
import com.defty.identity.repository.PermissionRepository;
import com.defty.identity.repository.RoleRepository;
import com.defty.identity.service.RoleService;
import com.defty.identity.specification.RoleSpecification;
import com.example.common_library.exceptions.AlreadyExitException;
import com.example.common_library.exceptions.NotFoundException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.HashSet;

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
        if (roleRepository.existsRoleByName(role.getName())) {
            throw new AppException(ErrorCode.ROLE_EXISTED);
        }
        roleRepository.save(role);
        return roleMapper.toRoleResponse(role);
    }

    @Override
    public Page<RoleResponse> findAllRoles(String name, Pageable pageable) {
        Specification<Role> spec = Specification.where(RoleSpecification.notDeleted());

        if (name != null && !name.trim().isEmpty()) {
            spec = spec.and(RoleSpecification.nameContains(name.trim()));
        }

        Page<Role> rolesPage = roleRepository.findAll(spec, pageable);
        return rolesPage.map(roleMapper::toRoleResponse);
    }

    @Override
    public RoleResponse updateRole(Long id, RoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Role not found"));

        if (roleRepository.existsByNameAndIdNot(request.getName(), id)) {
            throw new AlreadyExitException("Role with name '" + request.getName() + "' already exists");
        }

        if (request.getPermissions() != null) {
            var permissions = permissionRepository.findAllById(request.getPermissions());
            role.setPermissions(new HashSet<>(permissions));
        }

        role.setName(request.getName());
        role.setDescription(request.getDescription());
        return roleMapper.toRoleResponse(roleRepository.save(role));
    }

    @Override
    public RoleResponse getRoleById(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Role not found"));
        return roleMapper.toRoleResponse(role);
    }

    @Override
    public void deleteRole(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Role not found"));
        role.setIsActive(-1);
        roleRepository.save(role);
    }

    @Override
    public RoleResponse toggleRoleStatus(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Role not found with ID: " + id));

        if ("admin".equalsIgnoreCase(role.getName()) && role.getIsActive() == 1) {
            throw new AppException(ErrorCode.ROLE_DELETE_FORBIDDEN);
        }

        role.setIsActive(role.getIsActive() == 1 ? 0 : 1);
        Role updatedRole = roleRepository.save(role);

        return roleMapper.toRoleResponse(updatedRole);
    }

}
