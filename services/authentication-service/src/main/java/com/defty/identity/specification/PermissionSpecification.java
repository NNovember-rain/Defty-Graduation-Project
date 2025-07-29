package com.defty.identity.specification;

import com.defty.identity.entity.Permission;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

public class PermissionSpecification  {

    public static Specification<Permission> notDeleted() {
        return (root, query, cb) -> cb.notEqual(root.get("isActive"), -1);
    }

    public static Specification<Permission> nameContains(String name) {
        return (root, query, cb) -> cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%");
    }

    public static Specification<Permission> hasRoleIdAndIsActive(Long roleId) {
        return (root, query, cb) -> {
            if (roleId == null) return null;

            Join<Object, Object> join = root.join("roles");
            Predicate rolePredicate = cb.equal(join.get("id"), roleId);
            Predicate activePredicate = cb.equal(root.get("isActive"), 1);

            return cb.and(rolePredicate, activePredicate);
        };
    }


    public static Specification<Permission> hasNameContaining(String name) {
        return (root, query, cb) -> {
            if (name == null || name.trim().isEmpty()) return null;
            return cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%");
        };
    }
}