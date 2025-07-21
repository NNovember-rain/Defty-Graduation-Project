package com.ai_feedback_service.model.entity;


import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Type;

import java.util.Map;

@Entity
@Getter
@Setter
public class FeedbackAi extends BaseEntity {

    private Integer submissionsId;

    @Type(JsonBinaryType.class)

    @Column(columnDefinition = "jsonb")

    private Map<String, Object> feedback;
}
