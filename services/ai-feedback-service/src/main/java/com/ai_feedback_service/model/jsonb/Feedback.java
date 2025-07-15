package com.ai_feedback_service.model.jsonb;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Feedback {
    private String syntaxComments;
    private String structureComments;
    private String logicComments;
    private String improvementSuggestions;
    private String overallEvaluation;
}