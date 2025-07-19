package com.defty.content_service.specification;

import com.defty.content_service.entity.Assignment;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

public class AssignmentSpecification {

    public static Specification<Assignment> hasTypeUmlId(Long typeUmlId) {
        return (root, query, cb) -> {
            if (typeUmlId == null) return cb.conjunction();
            return cb.equal(root.get("typeUML").get("id"), typeUmlId);
        };
    }

    public static Specification<Assignment> hasTitleLike(String title) {
        return (root, query, cb) -> {
            if (title == null || title.trim().isEmpty()) return cb.conjunction();
            return cb.like(cb.lower(root.get("title")), "%" + title.toLowerCase() + "%");
        };
    }

    public static Specification<Assignment> hasClassId(Long classId) {
        return (root, query, cb) -> {
            if (classId == null) return cb.conjunction();

            // Avoid duplicate rows
            root.join("assignmentClasses", JoinType.INNER);
            query.distinct(true);

            return cb.equal(
                    root.join("assignmentClasses").get("classId"),
                    classId
            );
        };
    }
}
