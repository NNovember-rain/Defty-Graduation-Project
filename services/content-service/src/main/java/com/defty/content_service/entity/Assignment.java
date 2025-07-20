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
public class Assignment extends  BaseEntity{
    Long userId;
    String title;
    String description;
    @ManyToOne
    @JoinColumn(name = "type_uml_id")
    TypeUML typeUML;

    @OneToMany(mappedBy = "assignment", fetch = FetchType.LAZY)
    Set<AssignmentClass> assignmentClasses;
}
