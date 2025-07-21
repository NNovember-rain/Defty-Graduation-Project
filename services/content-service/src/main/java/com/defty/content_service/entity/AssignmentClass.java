package com.defty.content_service.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
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
public class AssignmentClass extends BaseEntity{
    @ManyToOne
    @JoinColumn(name = "assignment_id")
    Assignment assignment;

    Long classId;
    String status;
    Date startDate;
    Date endDate;
}
