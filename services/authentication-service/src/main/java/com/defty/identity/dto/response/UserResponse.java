package com.defty.identity.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.Date;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    Long id;
    String username;
    String fullName;
    LocalDate dob;
    Set<RoleResponse> roles;
    String userCode;
    Date createdDate;
    String email;
    String avatarUrl;
    Integer isActive; // 1 for active, 0 for inactive, -1 for deleted
    String apiKey;
}
