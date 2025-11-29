package com.defty.identity.mapper;

import com.defty.identity.dto.request.UserCreationRequest;
import com.defty.identity.dto.request.UserUpdateRequest;
import com.defty.identity.dto.response.UserResponse;
import com.defty.identity.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User toUser(UserCreationRequest request);

    @Mapping(source = "userCode", target = "userCode")
    @Mapping(source = "isActive", target = "isActive")
    @Mapping(source = "id", target = "id")
    @Mapping(source = "createdDate", target = "createdDate")
    @Mapping(target = "apiKey", ignore = true)
    UserResponse toUserResponse(User user);

    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "apiKey", ignore = true)
    void updateUser(@MappingTarget User user, UserUpdateRequest request);
}

