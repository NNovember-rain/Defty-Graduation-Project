package com.defty.identity.service;

import com.defty.identity.dto.request.RoleRequest;
import com.defty.identity.dto.response.RoleResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface RoleService {
    RoleResponse createRole(RoleRequest roleRequest);
    Page<RoleResponse> findAllRoles(String name, Pageable pageable);
}
