package com.defty.content_service.entity;

import com.defty.content_service.enums.TypeUml;
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
public class ModuleSolution extends BaseEntity{
    @ManyToOne(fetch = FetchType.LAZY)
    ModuleEntity module;

    @Column(columnDefinition = "TEXT")
    String solutionCode;

    @Enumerated(EnumType.STRING)
    TypeUml typeUml;
}
