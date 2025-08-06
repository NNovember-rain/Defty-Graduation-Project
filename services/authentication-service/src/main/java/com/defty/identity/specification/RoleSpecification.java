package com.defty.identity.specification;

import com.defty.identity.entity.Role;
import org.springframework.data.jpa.domain.Specification;

public class RoleSpecification {

    public static Specification<Role> notDeleted() {
        return (root, query, cb) -> cb.isFalse(root.get("deleted"));
    }

    public static Specification<Role> nameContains(String name) {
        return (root, query, cb) -> cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%");
    }
}

