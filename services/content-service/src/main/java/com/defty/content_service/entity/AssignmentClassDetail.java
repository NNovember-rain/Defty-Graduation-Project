package com.defty.content_service.entity;

import com.defty.content_service.enums.TypeUml;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.ManyToOne;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Date;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssignmentClassDetail extends BaseEntity{
    @Enumerated(EnumType.STRING)
    TypeUml typeUml;

    @ManyToOne
    AssignmentClass assignmentClass;

    @ManyToOne
    ModuleEntity module;
    boolean checked;

    Date startDate;
    Date endDate;
}
