package com.submission_service.repository.specification;

import com.submission_service.model.buider.SubmissionSearchBuilder;
import com.submission_service.model.entity.Submission;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class SubmissionSpecification {

    public static Specification<Submission> withCriteria(SubmissionSearchBuilder criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getStudentName() != null && !criteria.getStudentName().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("studentName")),
                        "%" + criteria.getStudentName().toLowerCase() + "%"));
            }

            if (criteria.getStudentCode() != null && !criteria.getStudentCode().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("studentCode")),
                        "%" + criteria.getStudentCode().toLowerCase() + "%"));
            }

            if (criteria.getAssignmentTitle() != null && !criteria.getAssignmentTitle().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("assignmentTitle")),
                        "%" + criteria.getAssignmentTitle().toLowerCase() + "%"));
            }

            if (criteria.getClassName() != null && !criteria.getClassName().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("className")),
                        "%" + criteria.getClassName().toLowerCase() + "%"));
            }

            if (criteria.getClassCode() != null && !criteria.getClassCode().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("classCode")),
                        "%" + criteria.getClassCode().toLowerCase() + "%"));
            }

            if (criteria.getUmlType() != null && !criteria.getUmlType().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("umlType")),
                        "%" + criteria.getUmlType().toLowerCase() + "%"));
            }

            // Sửa tên trường từ "status" thành "submissionStatus"
            if (criteria.getSubmissionStatus() != null) {
                predicates.add(cb.equal(root.get("submissionStatus"), criteria.getSubmissionStatus()));
            }

            if (criteria.getFromDate() != null) {
                LocalDateTime fromDateTime = criteria.getFromDate().atStartOfDay();
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdDate"), fromDateTime));
            }

            if (criteria.getToDate() != null) {
                LocalDateTime toDateTime = criteria.getToDate().atTime(23, 59, 59);
                predicates.add(cb.lessThanOrEqualTo(root.get("createdDate"), toDateTime));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}