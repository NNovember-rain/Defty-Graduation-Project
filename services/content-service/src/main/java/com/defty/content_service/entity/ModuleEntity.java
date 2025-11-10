package com.defty.content_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ModuleEntity extends BaseEntity {
    @Column(columnDefinition = "TEXT")
    String moduleCode;
    String moduleName;

    @ManyToOne(fetch = FetchType.LAZY)
    Assignment assignment;

    @Column(columnDefinition = "TEXT")
    String moduleDescription;

    @OneToMany(mappedBy = "module", cascade = CascadeType.ALL, orphanRemoval = true)
    List<ModuleSolution> moduleSolutions;
}
