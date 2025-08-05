package com.defty.identity.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.Set;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User extends BaseEntity {

    @Column(unique = true, nullable = false)
    String username;

    String password;
    String fullName;
    LocalDate dob;
    Integer isActive = 1; // 1 for active, 0 for inactive, -1 for deleted
    String userCode;

    @Column(unique = true, nullable = false)
    String email;

    @ManyToMany
    Set<Role> roles;
}
