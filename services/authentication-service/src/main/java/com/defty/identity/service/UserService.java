package com.defty.identity.service;

import com.defty.identity.dto.request.UserCreationRequest;
import com.defty.identity.dto.request.UserUpdateRequest;
import com.defty.identity.dto.response.UserResponse;

import java.util.List;

public interface UserService {
    UserResponse createUser(UserCreationRequest request);
    UserResponse updateUser(Long userId, UserUpdateRequest request);
    UserResponse getUser(Long userId);
    void deleteUser(Long userId);
    List<UserResponse> getUsers();
    UserResponse getMyInfo();
}
