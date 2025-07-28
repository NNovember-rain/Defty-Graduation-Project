package com.defty.identity.controller;

import com.defty.identity.dto.request.UserCreationRequest;
import com.defty.identity.dto.request.UserUpdateRequest;
import com.defty.identity.dto.response.ApiResponse;
import com.defty.identity.dto.response.UserResponse;
import com.defty.identity.service.UserService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserController {
    UserService userService;

    @PostMapping("/registration")
    ApiResponse<UserResponse> createUser(@RequestBody @Valid UserCreationRequest request){
        return ApiResponse.<UserResponse>builder()
                .result(userService.createUser(request))
                .build();
    }

    @PreAuthorize("hasRole('admin')")
    @GetMapping
    ApiResponse<Page<UserResponse>> getUsers(@RequestParam(value = "page", defaultValue = "0") int page,
                                             @RequestParam(value = "size", defaultValue = "10") int size,
                                             @RequestParam(required = false) String username,
                                             @RequestParam(required = false) String email) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdDate").descending());
        Page<UserResponse> result = userService.getUsers(username, email, pageable);
        return ApiResponse.<Page<UserResponse>>builder()
                .result(result)
                .build();
    }

    @PreAuthorize("hasRole('admin')")
    @GetMapping("/{id}")
    ApiResponse<UserResponse> getUser(@PathVariable("id") Long userId){
        return ApiResponse.<UserResponse>builder()
                .result(userService.getUser(userId))
                .build();
    }

    @GetMapping("/myInfo")
    ApiResponse<UserResponse> getMyInfo(){
        return ApiResponse.<UserResponse>builder()
                .result(userService.getMyInfo())
                .build();
    }

    @PreAuthorize("hasRole('admin')")
    @PutMapping("/{id}")
    ApiResponse<UserResponse> updateUser(@PathVariable Long id, @RequestBody UserUpdateRequest request){
        return ApiResponse.<UserResponse>builder()
                .result(userService.updateUser(id, request))
                .build();
    }

    @PreAuthorize("hasRole('admin')")
    @DeleteMapping("/{id}")
    ApiResponse<String> deleteUser(@PathVariable Long id){
        userService.deleteUser(id);
        return ApiResponse.<String>builder()
                .result("User has been deleted")
                .build();
    }

    @PreAuthorize("hasRole('admin')")
    @PatchMapping("/{id}/toggle-active")
    ApiResponse<UserResponse> toggleActiveStatus(@PathVariable Long id) {
        UserResponse updatedUser = userService.toggleActiveStatus(id);
        return ApiResponse.<UserResponse>builder()
                .result(updatedUser)
                .message("User status toggled successfully")
                .build();
    }

}
