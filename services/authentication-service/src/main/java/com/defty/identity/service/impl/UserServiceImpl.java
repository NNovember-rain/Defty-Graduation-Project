package com.defty.identity.service.impl;

import com.defty.identity.dto.request.UserCreationRequest;
import com.defty.identity.dto.request.UserUpdateRequest;
import com.defty.identity.dto.response.UserExistenceCheckResult;
import com.defty.identity.dto.response.UserResponse;
import com.defty.identity.entity.BaseEntity;
import com.defty.identity.entity.Role;
import com.defty.identity.entity.User;
import com.defty.identity.exception.AppException;
import com.defty.identity.exception.ErrorCode;
import com.defty.identity.mapper.UserMapper;
import com.defty.identity.repository.RoleRepository;
import com.defty.identity.repository.UserRepository;
import com.defty.identity.service.UserService;
import com.defty.identity.specification.UserSpecification;
import com.example.common_library.exceptions.AlreadyExitException;
import com.example.common_library.exceptions.NotFoundException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserServiceImpl implements UserService {
    UserRepository userRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;
    RoleRepository roleRepository;

    @Override
    public UserResponse createUser(UserCreationRequest request) {
        if (userRepository.existsByUsername(request.getUsername()))
            throw new AppException(ErrorCode.USER_EXISTED);
        if (userRepository.existsByEmail(request.getEmail()))
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        if (userRepository.existsByUserCode(request.getUserCode()))
            throw new AppException(ErrorCode.USER_CODE_EXISTED);

        User user = userMapper.toUser(request);
        user.setIsActive(1);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTED));
        user.setRoles(new HashSet<>(List.of(role)));
        user.setUserCode(request.getUserCode());

        return userMapper.toUserResponse(userRepository.save(user));
    }


    @Override
    public UserResponse updateUser(Long userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (userRepository.existsByUsernameAndIdNot(request.getUsername(), userId)) {
            throw new AlreadyExitException("Username '" + request.getUsername() + "' already exists");
        }

        if (userRepository.existsByEmailAndIdNot(request.getEmail(), userId)) {
            throw new AlreadyExitException("Email '" + request.getEmail() + "' already exists");
        }

        if (userRepository.existsByUserCodeAndIdNot(request.getUserCode(), userId)) {
            throw new AlreadyExitException("User code '" + request.getUserCode() + "' already exists");
        }

        userMapper.updateUser(user, request);

        if (request.getRoles() != null) {
            List<Long> roleIds = request.getRoles().stream()
                    .map(BaseEntity::getId)
                    .toList();
            var roles = roleRepository.findAllById(roleIds);
            user.setRoles(new HashSet<>(roles));
        }

        return userMapper.toUserResponse(userRepository.save(user));
    }


    @Override
    public void deleteUser(Long userId){
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with ID: " + userId));
        user.setIsActive(-1);
        userRepository.save(user);
    }

    @Override
    public Page<UserResponse> getUsers(String username, String email, Pageable pageable) {
        Specification<User> spec = UserSpecification.build(username, email);
        return userRepository.findAll(spec, pageable)
                .map(userMapper::toUserResponse);
    }

    @Override
    public UserResponse getMyInfo() {
        var context = SecurityContextHolder.getContext();
        String name = context.getAuthentication().getName();

        return userMapper.toUserResponse(userRepository.findByUsername(name)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)));
    }

    @Override
    public UserResponse toggleActiveStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with ID: " + userId));

        user.setIsActive(user.getIsActive() == 1 ? 0 : 1);
        userRepository.save(user);
        return userMapper.toUserResponse(user);
    }

    @Override
    public List<UserResponse> getAllUsersByRole(String fullName, Long roleId) {
        Specification<User> spec = UserSpecification.buildActive(fullName, roleId);

        return userRepository.findAll(spec)
                .stream().map(userMapper::toUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    public UserExistenceCheckResult checkUsersExistByIds(List<Long> userIds) {
        List<User> users = userRepository.findAllById(userIds);

        List<UserResponse> foundUsers = users.stream()
                .map(userMapper::toUserResponse)
                .toList();

        List<Long> foundIds = users.stream()
                .map(User::getId)
                .toList();

        List<Long> notFoundIds = userIds.stream()
                .filter(id -> !foundIds.contains(id))
                .toList();

        return new UserExistenceCheckResult(foundUsers, notFoundIds);
    }

    @Override
    public List<UserResponse> getUsersByIds(List<Long> userIds) {
        List<User> users = userRepository.findAllByIdInAndIsActive(userIds, 1);
        if (!users.isEmpty()) {
            return users.stream()
                    .map(userMapper::toUserResponse)
                    .collect(Collectors.toList());
        }
        throw new NotFoundException("No users found with the provided IDs: " + userIds);
    }

    @Override
    public UserResponse getUser(Long id){
        return userMapper.toUserResponse(userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found")));
    }
}

