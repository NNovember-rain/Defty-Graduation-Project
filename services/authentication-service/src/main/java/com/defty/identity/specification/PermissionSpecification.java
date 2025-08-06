package com.defty.identity.specification;

import com.defty.identity.entity.Permission;
import org.springframework.data.jpa.domain.Specification;

public class PermissionSpecification  {

    public static Specification<Permission> notDeleted() {
        return (root, query, cb) -> cb.isFalse(root.get("deleted"));
    }

    public static Specification<Permission> nameContains(String name) {
        return (root, query, cb) -> cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%");
    }
}