package com.defty.content_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Date;
import java.util.List;
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

    @Column(columnDefinition = "TEXT")
    String description;

    @Column(columnDefinition = "TEXT")
    String descriptionHtml;

    String assignmentCode;

    @Column
    Date startDate;

    @Column
    Date endDate;

    @OneToMany(mappedBy = "assignment", fetch = FetchType.LAZY)
    Set<AssignmentClass> assignmentClasses;

    @OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL, orphanRemoval = true)
    List<ModuleEntity> modules;
}
