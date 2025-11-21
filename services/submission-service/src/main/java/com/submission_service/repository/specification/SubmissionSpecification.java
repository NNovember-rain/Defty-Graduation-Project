package com.submission_service.repository.specification;

import com.submission_service.model.entity.Submission;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public class SubmissionSpecification {

    public static Specification<Submission> hasCreatedDateAfter(LocalDateTime startDate) {
        return (root, query, cb) -> {
            if (startDate == null) {
                return cb.conjunction();
            }
            return cb.greaterThanOrEqualTo(root.get("createdDate"), startDate);
        };
    }

    public static Specification<Submission> hasCreatedDateBefore(LocalDateTime endDate) {
        return (root, query, cb) -> {
            if (endDate == null) {
                return cb.conjunction();
            }
            return cb.lessThanOrEqualTo(root.get("createdDate"), endDate);
        };
    }

    public static Specification<Submission> hasCreatedDateBetween(LocalDateTime startDate, LocalDateTime endDate) {
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

    public static Specification<Submission> hasStudentId(Long studentId) {
        return (root, query, cb) -> {
            if (studentId == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("studentId"), studentId);
        };
    }


    public static Specification<Submission> hasModuleId(Long moduleId) {
        return (root, query, cb) -> {
            if (moduleId == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("moduleId"), moduleId);
        };
    }

    public static Specification<Submission> hasClassId(Long classId) {
        return (root, query, cb) -> {
            if (classId == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("classId"), classId);
        };
    }

    public static Specification<Submission> hasAssignmentId(Long assignmentId) {
        return (root, query, cb) -> {
            if (assignmentId == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("assignmentId"), assignmentId);
        };
    }

    public static Specification<Submission> hasAssignmentClassDetailId(Long assignmentClassDetailId) {
        return (root, query, cb) -> {
            if (assignmentClassDetailId == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("assignmentClassDetailId"), assignmentClassDetailId);
        };
    }

    public static Specification<Submission> isLatestSubmissionPerWithExamMode() {
        return (root, query, cb) -> {
            Subquery<LocalDateTime> subquery = query.subquery(LocalDateTime.class);
            Root<Submission> subRoot = subquery.from(Submission.class);

            subquery.select(cb.greatest(subRoot.get("createdDate").as(LocalDateTime.class)))
                    .where(
                            cb.equal(subRoot.get("studentId"), root.get("studentId")),
                            cb.equal(subRoot.get("classId"), root.get("classId")),
                            cb.equal(subRoot.get("assignmentId"), root.get("assignmentId")),
                            cb.equal(subRoot.get("examMode"), true)
                    );

            return cb.and(
                    cb.equal(root.get("createdDate"), subquery),
                    cb.equal(root.get("examMode"), true)
            );
        };
    }

    public static Specification<Submission> hasExamMode(Boolean examMode) {
        return (root, query, cb) -> {
            if (examMode == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("examMode"), examMode);
        };
    }

}
