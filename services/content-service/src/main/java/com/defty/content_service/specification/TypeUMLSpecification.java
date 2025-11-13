//package com.defty.content_service.specification;
//
//import com.defty.content_service.entity.TypeUML;
//import org.springframework.data.jpa.domain.Specification;
//
//public class TypeUMLSpecification {
//    public static Specification<TypeUML> isActiveOnly() {
//        return (root, query, cb) -> cb.in(root.get("isActive")).value(0).value(1);
//    }
//
//    public static Specification<TypeUML> hasNameLike(String name) {
//        return (root, query, criteriaBuilder) -> {
//            if (name == null || name.isEmpty()) return null;
//            return criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), "%" + name.toLowerCase() + "%");
//        };
//    }
//}
//
