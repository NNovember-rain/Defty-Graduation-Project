package com.submission_service.repository.specification;

import com.submission_service.model.entity.AutoFeedbackLLMEntry;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public class AutoFeedbackLLMEntrySpecification {
    public static Specification<AutoFeedbackLLMEntry> hasCreatedDateAfter(LocalDateTime startDate) {
        return (root, query, cb) -> {
            if (startDate == null) {
                return cb.conjunction();
            }
            return cb.greaterThanOrEqualTo(root.get("createdDate"), startDate);
        };
    }

    public static Specification<AutoFeedbackLLMEntry> hasCreatedDateBefore(LocalDateTime endDate) {
        return (root, query, cb) -> {
            if (endDate == null) {
                return cb.conjunction();
            }
            return cb.lessThanOrEqualTo(root.get("createdDate"), endDate);
        };
    }

    public static Specification<AutoFeedbackLLMEntry> hasCreatedDateBetween(LocalDateTime startDate, LocalDateTime endDate) {
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

    public static Specification<AutoFeedbackLLMEntry> hasStudentInfo(String studentInfo) {
        return (root, query, cb) -> {
            if (studentInfo == null || studentInfo.trim().isEmpty()) {
                return cb.conjunction();
            }
            return cb.like(cb.lower(root.get("studentInfo")), "%" + studentInfo.toLowerCase() + "%");
        };
    }

    public static Specification<AutoFeedbackLLMEntry> hasAutoFeedBackLLMJobId(Long jobId) {
        return (root, query, cb) -> {
            if (jobId == null) {
                return cb.conjunction(); // không filter nếu jobId null
            }
            return cb.equal(root.get("autoFeedbackLLMJob").get("id"), jobId);
        };
    }

    public static Specification<AutoFeedbackLLMEntry> notDeleted() {
        return (root, query, cb) -> cb.isFalse(root.get("deleted"));
    }

}
