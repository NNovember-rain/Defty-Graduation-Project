package com.defty.content_service.entity;

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
public class TypeUML extends BaseEntity {
    @Column(nullable = false, unique = true)
    String name; // e.g., "UML", "ERD", etc.
    String description;

    @ManyToMany(mappedBy = "typeUMLs")
    Set<ModuleEntity> modules;
}
