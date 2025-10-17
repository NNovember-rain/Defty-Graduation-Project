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
public class ModuleEntity extends BaseEntity {

    String moduleCode;
    String moduleName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id")
    Assignment assignment;

    @Column(columnDefinition = "TEXT")
    String moduleDescription;

    @Column(columnDefinition = "TEXT")
    String solutionCode;

    @ManyToMany
    @JoinTable(
            name = "module_typeuml",
            joinColumns = @JoinColumn(name = "module_id"),
            inverseJoinColumns = @JoinColumn(name = "typeuml_id")
    )
    Set<TypeUML> typeUMLs;
}
