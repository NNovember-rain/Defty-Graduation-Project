package com.defty.identity.mapper;

import com.defty.identity.dto.request.PermissionRequest;
import com.defty.identity.dto.response.PermissionResponse;
import com.defty.identity.entity.Permission;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PermissionMapper {
    Permission toPermission(PermissionRequest request);
    @Mapping(source = "createdDate", target = "createdDate")
    PermissionResponse toPermissionResponse(Permission permission);
}

