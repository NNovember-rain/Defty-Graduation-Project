package com.defty.identity.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Permission extends  BaseEntity {
    @Column(nullable = false, length = 255, unique = true)
    String name;
    String description;
    Integer isActive = 1; // 1 for active, 0 for inactive, -1 for deleted

    @ManyToMany(mappedBy = "permissions")
    Set<Role> roles;
}
