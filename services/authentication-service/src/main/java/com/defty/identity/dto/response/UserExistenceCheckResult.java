package com.defty.identity.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserExistenceCheckResult {
    List<UserResponse> foundUsers;
    List<Long> notFoundIds;
}
