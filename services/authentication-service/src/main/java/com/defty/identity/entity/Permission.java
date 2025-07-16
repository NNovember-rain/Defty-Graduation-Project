package com.defty.identity.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

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
}
