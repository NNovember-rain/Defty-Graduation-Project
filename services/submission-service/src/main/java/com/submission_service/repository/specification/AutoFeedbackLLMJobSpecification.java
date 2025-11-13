package com.submission_service.repository.specification;

import com.submission_service.enums.TypeUml;
import com.submission_service.model.entity.AutoFeedbackLLMJob;
import com.submission_service.model.entity.AutoFeedbackLLMJob;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public class AutoFeedbackLLMJobSpecification {
    public static Specification<AutoFeedbackLLMJob> hasCreatedDateAfter(LocalDateTime startDate) {
        return (root, query, cb) -> {
            if (startDate == null) {
                return cb.conjunction();
            }
            return cb.greaterThanOrEqualTo(root.get("createdDate"), startDate);
        };
    }

    public static Specification<AutoFeedbackLLMJob> hasCreatedDateBefore(LocalDateTime endDate) {
        return (root, query, cb) -> {
            if (endDate == null) {
                return cb.conjunction();
            }
            return cb.lessThanOrEqualTo(root.get("createdDate"), endDate);
        };
    }

    public static Specification<AutoFeedbackLLMJob> hasCreatedDateBetween(LocalDateTime startDate, LocalDateTime endDate) {
        return (root, query, cb) -> {
            if (startDate == null && endDate == null) {
                return cb.conjunction();
            }
            if (startDate != null && endDate != null) {
                return cb.between(root.get("createdDate"), startDate, endDate);
            }
            if (startDate != null) {
                return cb.greaterThanOrEqualTo(root.get("createdDate"), startDate);
            }
            return cb.lessThanOrEqualTo(root.get("createdDate"), endDate);
        };
    }

    public static Specification<AutoFeedbackLLMJob> hasTitle(String title) {
        return (root, query, cb) -> {
            if (title == null || title.trim().isEmpty()) {
                return cb.conjunction();
            }
            return cb.like(cb.lower(root.get("title")), "%" + title.toLowerCase() + "%");
        };
    }

    public static Specification<AutoFeedbackLLMJob> hasTypeUml(TypeUml typeUml) {
        return (root, query, cb) -> {
            if (typeUml == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("typeUml"), typeUml);
        };
    }

    public static Specification<AutoFeedbackLLMJob> notDeleted() {
        return (root, query, cb) -> cb.isFalse(root.get("deleted"));
    }
}
