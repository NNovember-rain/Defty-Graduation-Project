package com.defty.identity.dto.request;

import com.defty.identity.entity.Role;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserUpdateRequest {
    String email;
    String username;
    String fullName;
    LocalDate dob;
    List<Role> roles;
    Integer isActive; // 1 for active, 0 for inactive
    String userCode;
}

