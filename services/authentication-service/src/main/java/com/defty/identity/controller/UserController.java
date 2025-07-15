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

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    ApiResponse<List<UserResponse>> getUsers(){
        return ApiResponse.<List<UserResponse>>builder()
                .result(userService.getUsers())
                .build();
    }

//    @PreAuthorize("hasRole('GET_USER')")
    @GetMapping("/{userId}")
    ApiResponse<UserResponse> getUser(@PathVariable("userId") Long userId){
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

//    @PreAuthorize("hasRole('UPDATE_USER')")
    @PutMapping("/{userId}")
    ApiResponse<UserResponse> updateUser(@PathVariable Long userId, @RequestBody UserUpdateRequest request){
        return ApiResponse.<UserResponse>builder()
                .result(userService.updateUser(userId, request))
                .build();
    }

//    @PreAuthorize("hasRole('DELETE_USER')")
    @DeleteMapping("/{userId}")
    ApiResponse<String> deleteUser(@PathVariable Long userId){
        userService.deleteUser(userId);
        return ApiResponse.<String>builder()
                .result("User has been deleted")
                .build();
    }
}
