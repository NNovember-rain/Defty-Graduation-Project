package com.defty.identity.specification;

import com.defty.identity.entity.User;
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

    public static Specification<User> build(String username, String email) {
        return Specification.where(usernameContains(username))
                .and(emailContains(email));
    }
}

