package com.defty.content_service.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
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
public class AssignmentClass extends BaseEntity{
    @ManyToOne
    Assignment assignment;

    @OneToMany(mappedBy = "assignmentClass", fetch = FetchType.LAZY)
    List<AssignmentClassDetail> assignmentClassDetails;

    Long classId;
}
