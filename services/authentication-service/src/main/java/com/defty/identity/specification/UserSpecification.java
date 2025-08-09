package com.defty.identity.specification;

import com.defty.identity.entity.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

public class UserSpecification {

    public static Specification<User> usernameContains(String username) {
        return (root, query, cb) ->
                username == null ? null : cb.like(cb.lower(root.get("username")), "%" + username.toLowerCase() + "%");
    }

    public static Specification<User> emailContains(String email) {
        return (root, query, cb) ->
                email == null ? null : cb.like(cb.lower(root.get("email")), "%" + email.toLowerCase() + "%");
    }

    public static Specification<User> fullNameContains(String fullName) {
        return (root, query, cb) ->
                fullName == null ? null : cb.like(cb.lower(root.get("fullName")), "%" + fullName.toLowerCase() + "%");
    }

    public static Specification<User> hasRoleId(Long roleId) {
        return (root, query, cb) -> {
            if (roleId == null) return null;

            // JOIN đến bảng role
            Join<Object, Object> roles = root.join("roles", JoinType.INNER);
            return cb.equal(roles.get("id"), roleId);
        };
    }


    public static Specification<User> build(String username, String email) {
        return Specification.where(usernameContains(username))
                .and(emailContains(email))
                .and((root, query, cb) -> cb.notEqual(root.get("isActive"), -1));
    }

    public static Specification<User> buildActive(String fullName, Long roleId) {
        return Specification.where(usernameContains(fullName))
                .and(hasRoleId(roleId))
                .and((root, query, cb) -> cb.equal(root.get("isActive"), 1));
    }

}

