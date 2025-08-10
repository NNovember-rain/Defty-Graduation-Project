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

    @Column(columnDefinition = "TEXT", nullable = false)
    String description;

    @Lob
    @Column(columnDefinition = "TEXT")
    String solutionCode;

    String assignmentCode;

    @ManyToOne
    @JoinColumn(name = "type_uml_id")
    TypeUML typeUML;

    @OneToMany(mappedBy = "assignment", fetch = FetchType.LAZY)
    Set<AssignmentClass> assignmentClasses;
}
