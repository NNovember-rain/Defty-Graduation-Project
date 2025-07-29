package com.defty.identity.service;

import com.defty.identity.dto.request.UserCreationRequest;
import com.defty.identity.dto.request.UserUpdateRequest;
import com.defty.identity.dto.response.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {
    UserResponse createUser(UserCreationRequest request);
    UserResponse updateUser(Long userId, UserUpdateRequest request);
    UserResponse getUser(Long userId);
    void deleteUser(Long userId);
    Page<UserResponse> getUsers(String username, String email, Pageable pageable);
    UserResponse getMyInfo();
    UserResponse toggleActiveStatus(Long userId);
}
