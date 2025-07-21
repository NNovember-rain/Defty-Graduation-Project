package com.defty.content_service.specification;

import com.defty.content_service.entity.Material;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class MaterialSpecification {
    public static Specification<Material> filter(String type, String format, String title) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (type != null && !type.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("type")), type.toLowerCase()));
            }

            if (format != null && !format.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("format")), format.toLowerCase()));
            }

            if (title != null && !title.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("title")), "%" + title.toLowerCase() + "%"));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

