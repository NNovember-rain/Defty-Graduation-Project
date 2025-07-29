package com.submission_service.repository.specification;

import com.submission_service.model.buider.SubmissionSearchBuilder;
import com.submission_service.model.entity.Submission;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;


public class SubmissionSpecification {

    public static Specification<Submission> withCriteria(SubmissionSearchBuilder criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getStudentName() != null && !criteria.getStudentName().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("studentName")), "%" + criteria.getStudentName().toLowerCase() + "%"));
            }

            if (criteria.getAssignmentTitle() != null && !criteria.getAssignmentTitle().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("assignmentTitle")), "%" + criteria.getAssignmentTitle().toLowerCase() + "%"));
            }

            if (criteria.getClassName() != null && !criteria.getClassName().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("className")), "%" + criteria.getClassName().toLowerCase() + "%"));
            }

            if (criteria.getSubmissionStatus() != null) {
                predicates.add(cb.equal(root.get("status"), criteria.getSubmissionStatus()));
            }

            if (criteria.getFromDate() != null) {
                Date from = Date.from(criteria.getFromDate().atStartOfDay().atZone(ZoneId.systemDefault()).toInstant());
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdDate"), from));
            }

            if (criteria.getToDate() != null) {
                Date to = Date.from(criteria.getToDate().atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant());
                predicates.add(cb.lessThanOrEqualTo(root.get("createdDate"), to));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
