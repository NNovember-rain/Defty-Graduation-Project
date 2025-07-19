package com.defty.content_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
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

    @OneToMany(mappedBy = "typeUML", fetch = FetchType.LAZY)
    Set<Assignment> assignments;
}
