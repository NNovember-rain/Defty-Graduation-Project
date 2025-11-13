package com.submission_service.model.entity;

import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.Type;

import java.util.Map;

@Entity
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "feedback_llm_")
public class FeedbackLLM extends BaseEntity {

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    Map<String, Object> feedback;

    String aiModalName;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "submission_id", referencedColumnName = "id")
    private Submission submission;
}
