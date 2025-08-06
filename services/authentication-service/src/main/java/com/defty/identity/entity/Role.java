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
public class Role extends  BaseEntity {
    @Column(nullable = false, length = 255, unique = true)
    String name;
    String description;
    boolean deleted = false;

    @ManyToMany
    Set<Permission> permissions;
}